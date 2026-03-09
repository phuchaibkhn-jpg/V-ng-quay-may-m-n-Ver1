import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const db = new Database("game.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT UNIQUE,
    email TEXT,
    zalo_id TEXT,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    spins_remaining INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    prize_name TEXT,
    voucher_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Default settings
const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
insertSetting.run("odds", JSON.stringify([
  { name: "Voucher 10%", weight: 30, color: "#FF9F1C" },
  { name: "Voucher 20%", weight: 15, color: "#2EC4B6" },
  { name: "Voucher 50k", weight: 10, color: "#E71D36" },
  { name: "Voucher 100k", weight: 5, color: "#011627" },
  { name: "Free ship", weight: 20, color: "#FFBF69" },
  { name: "Quà bí mật", weight: 5, color: "#CBF3F0" },
  { name: "Chúc may mắn", weight: 15, color: "#FFFFFF" }
]));
insertSetting.run("links", JSON.stringify({
  fanpage: "https://facebook.com",
  zalo_oa: "https://zalo.me",
  use_now: "https://shopee.vn"
}));
insertSetting.run("anti_fraud", JSON.stringify({
  reward_on_share_click: false, // Default to false to prevent spam as requested
  referral_reward_spins: 2
}));
insertSetting.run("brand", JSON.stringify({
  name: "LUCKY WHEEL",
  logo: "https://picsum.photos/seed/logo/200/200"
}));
insertSetting.run("countdown_end", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    const { name, phone, email, referredByCode } = req.body;
    
    try {
      const id = uuidv4();
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      let referredByUserId = null;
      if (referredByCode) {
        const referrer = db.prepare("SELECT id FROM users WHERE referral_code = ?").get(referredByCode) as any;
        if (referrer) {
          referredByUserId = referrer.id;
        }
      }

      const stmt = db.prepare(`
        INSERT INTO users (id, name, phone, email, referral_code, referred_by, spins_remaining)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `);
      stmt.run(id, name, phone, email, referralCode, referredByUserId);

      // If referred, give the referrer spins based on config
      if (referredByUserId) {
        const antiFraud = db.prepare("SELECT value FROM settings WHERE key = 'anti_fraud'").get() as any;
        const config = JSON.parse(antiFraud.value);
        db.prepare("UPDATE users SET spins_remaining = spins_remaining + ? WHERE id = ?").run(config.referral_reward_spins || 2, referredByUserId);
      }

      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      res.json(user);
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed: users.phone")) {
        // If user exists, just return the user
        const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
        res.json(user);
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  app.post("/api/spin", (req, res) => {
    const { userId } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    
    if (!user || user.spins_remaining <= 0) {
      return res.status(400).json({ error: "No spins left" });
    }

    const settings = db.prepare("SELECT value FROM settings WHERE key = 'odds'").get() as any;
    const odds = JSON.parse(settings.value);
    
    // Weighted random selection
    const totalWeight = odds.reduce((sum: number, item: any) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedPrize = odds[odds.length - 1];
    
    for (const item of odds) {
      if (random < item.weight) {
        selectedPrize = item;
        break;
      }
      random -= item.weight;
    }

    const voucherCode = selectedPrize.name.includes("Voucher") || selectedPrize.name.includes("ship") 
      ? "LUCKY-" + Math.random().toString(36).substring(2, 10).toUpperCase()
      : null;

    db.prepare("UPDATE users SET spins_remaining = spins_remaining - 1 WHERE id = ?").run(userId);
    
    if (selectedPrize.name !== "Chúc may mắn") {
      db.prepare("INSERT INTO prizes (user_id, prize_name, voucher_code) VALUES (?, ?, ?)")
        .run(userId, selectedPrize.name, voucherCode);
    }

    res.json({ prize: selectedPrize.name, voucherCode });
  });

  app.post("/api/action/share", (req, res) => {
    const { userId } = req.body;
    const antiFraud = db.prepare("SELECT value FROM settings WHERE key = 'anti_fraud'").get() as any;
    const config = JSON.parse(antiFraud.value);

    if (config.reward_on_share_click) {
      db.prepare("UPDATE users SET spins_remaining = spins_remaining + 1 WHERE id = ?").run(userId);
      return res.json({ success: true, rewarded: true });
    }
    
    res.json({ success: true, rewarded: false, message: "Chỉ cộng lượt khi bạn bè đăng ký thành công" });
  });

  app.get("/api/settings", (req, res) => {
    const odds = db.prepare("SELECT value FROM settings WHERE key = 'odds'").get() as any;
    const links = db.prepare("SELECT value FROM settings WHERE key = 'links'").get() as any;
    const antiFraud = db.prepare("SELECT value FROM settings WHERE key = 'anti_fraud'").get() as any;
    const brand = db.prepare("SELECT value FROM settings WHERE key = 'brand'").get() as any;
    const countdownEnd = db.prepare("SELECT value FROM settings WHERE key = 'countdown_end'").get() as any;
    res.json({ 
      odds: JSON.parse(odds.value), 
      links: JSON.parse(links.value),
      antiFraud: JSON.parse(antiFraud.value),
      brand: brand ? JSON.parse(brand.value) : { name: "LUCKY WHEEL", logo: "" },
      countdownEnd: countdownEnd ? countdownEnd.value : null
    });
  });

  app.get("/api/leaderboard", (req, res) => {
    const topReferrers = db.prepare(`
      SELECT u.name, COUNT(r.id) as invite_count
      FROM users u
      LEFT JOIN users r ON u.id = r.referred_by
      GROUP BY u.id
      ORDER BY invite_count DESC
      LIMIT 10
    `).all();

    const recentWinners = db.prepare(`
      SELECT u.name, p.prize_name, p.created_at
      FROM prizes p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all();

    res.json({ topReferrers, recentWinners });
  });

  app.get("/api/admin/stats", (req, res) => {
    const totalLeads = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const totalSpins = db.prepare("SELECT COUNT(*) as count FROM prizes").get() as any;
    const leads = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    const prizes = db.prepare("SELECT p.*, u.name as user_name FROM prizes p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC").all();
    res.json({ totalLeads: totalLeads.count, totalSpins: totalSpins.count, leads, prizes });
  });

  app.post("/api/admin/settings", (req, res) => {
    const { odds, links, antiFraud, brand, countdownEnd } = req.body;
    if (odds) db.prepare("UPDATE settings SET value = ? WHERE key = 'odds'").run(JSON.stringify(odds));
    if (links) db.prepare("UPDATE settings SET value = ? WHERE key = 'links'").run(JSON.stringify(links));
    if (antiFraud) db.prepare("UPDATE settings SET value = ? WHERE key = 'anti_fraud'").run(JSON.stringify(antiFraud));
    if (brand) db.prepare("UPDATE settings SET value = ? WHERE key = 'brand'").run(JSON.stringify(brand));
    if (countdownEnd) db.prepare("UPDATE settings SET value = ? WHERE key = 'countdown_end'").run(countdownEnd);
    res.json({ success: true });
  });

  app.get("/api/admin/export", (req, res) => {
    const leads = db.prepare("SELECT * FROM users").all() as any[];
    const header = "ID,Name,Phone,Email,ReferralCode,SpinsRemaining,CreatedAt\n";
    const csv = header + leads.map(l => `${l.id},${l.name},${l.phone},${l.email},${l.referral_code},${l.spins_remaining},${l.created_at}`).join("\n");
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.status(200).send(csv);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
