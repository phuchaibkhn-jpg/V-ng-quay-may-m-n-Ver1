/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Share2, 
  Users, 
  Bell, 
  Clock, 
  Gift, 
  Copy, 
  ExternalLink,
  ChevronRight,
  UserPlus,
  Heart,
  Settings,
  X,
  CheckCircle2,
  Facebook,
  MessageCircle,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// --- Types ---
interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  referral_code: string;
  spins_remaining: number;
}

interface Prize {
  name: string;
  weight: number;
  color: string;
}

// --- Components ---

const LuckyWheel = ({ onSpinComplete, spinsRemaining, isSpinning, prizes }: { 
  onSpinComplete: (prize: string, voucherCode?: string) => void, 
  spinsRemaining: number,
  isSpinning: boolean,
  prizes: Prize[]
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const angleStep = (2 * Math.PI) / prizes.length;

    prizes.forEach((prize, i) => {
      const startAngle = i * angleStep;
      const endAngle = (i + 1) * angleStep;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + angleStep / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = prize.color === '#FFFFFF' || prize.color === '#CBF3F0' ? '#333' : '#fff';
      ctx.font = 'bold 10px Inter';
      ctx.fillText(prize.name, radius - 20, 5);
      ctx.restore();
    });

    // Outer border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [prizes]);

  return (
    <div className="lucky-wheel-container">
      <div className="wheel-pointer">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 40L35 15H5L20 40Z" fill="#D83121" stroke="white" strokeWidth="2"/>
        </svg>
      </div>
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }}
        className="w-full h-full"
      >
        <canvas ref={canvasRef} width={320} height={320} className="rounded-full shadow-2xl" />
      </motion.div>
      
      <button
        onClick={() => {
          if (isSpinning || spinsRemaining <= 0) return;
          const newRotation = rotation + 3600 + Math.random() * 360;
          setRotation(newRotation);
          // Actual logic handled by parent
          onSpinComplete("", ""); 
        }}
        disabled={isSpinning || spinsRemaining <= 0}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-yellow-400 border-4 border-white shadow-lg flex items-center justify-center font-bold text-red-600 text-sm z-20 hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isSpinning ? "..." : "QUAY"}
      </button>
    </div>
  );
};

const SocialProof = () => {
  const [notification, setNotification] = useState<string | null>(null);
  const names = ["Lan", "Minh", "Tuấn", "Hương", "Dũng", "Thảo", "Hoàng", "An"];
  const prizes = ["voucher 100k", "free ship", "voucher 50k", "quà bí mật"];

  useEffect(() => {
    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      setNotification(`${name} vừa trúng ${prize}`);
      setTimeout(() => setNotification(null), 3000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 20, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="fixed bottom-24 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 border border-orange-200"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">{notification}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Countdown = ({ endTime }: { endTime: string | null }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (!endTime) return null;

  return (
    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full text-xs font-mono">
      <Clock size={14} className="text-yellow-400" />
      <span>Kết thúc sau: {timeLeft.d > 0 ? `${timeLeft.d}d ` : ''}{pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}</span>
    </div>
  );
};

const AdminPanel = ({ onClose, onSettingsUpdate }: { onClose: () => void, onSettingsUpdate: () => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');
  const [editOdds, setEditOdds] = useState<Prize[]>([]);
  const [editLinks, setEditLinks] = useState<any>({});
  const [editAntiFraud, setEditAntiFraud] = useState<any>({});
  const [editBrand, setEditBrand] = useState<any>({ name: '', logo: '' });
  const [editCountdownEnd, setEditCountdownEnd] = useState('');

  useEffect(() => {
    if (isAuthorized) {
      axios.get('/api/admin/stats').then(res => setStats(res.data));
      axios.get('/api/settings').then(res => {
        setEditOdds(res.data.odds);
        setEditLinks(res.data.links);
        setEditAntiFraud(res.data.antiFraud);
        setEditBrand(res.data.brand);
        setEditCountdownEnd(res.data.countdownEnd ? res.data.countdownEnd.split('.')[0] : '');
      });
    }
  }, [isAuthorized]);

  const handleSaveSettings = async () => {
    try {
      await axios.post('/api/admin/settings', { 
        odds: editOdds, 
        links: editLinks,
        antiFraud: editAntiFraud,
        brand: editBrand,
        countdownEnd: editCountdownEnd
      });
      alert("Đã lưu cài đặt!");
      onSettingsUpdate();
    } catch (e) {
      alert("Lỗi khi lưu cài đặt");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Admin Login</h2>
          <input 
            type="password" 
            placeholder="Mật khẩu"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border mb-4 text-gray-800"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => { if(password === 'admin123') setIsAuthorized(true); else alert('Sai mật khẩu'); }}
              className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl"
            >
              Đăng nhập
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-[200] overflow-y-auto p-4 text-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-orange-500" /> Admin Dashboard
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === 'stats' ? 'settings' : 'stats')}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              {activeTab === 'stats' ? 'Cài đặt' : 'Thống kê'}
            </button>
            <a href="/api/admin/export" className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <Copy size={16} /> Xuất CSV
            </a>
            <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-xl text-sm font-bold">Thoát</button>
          </div>
        </div>

        {activeTab === 'stats' ? (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tổng Lead</p>
                  <p className="text-3xl font-black text-orange-500">{stats.totalLeads}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tổng Lượt Quay</p>
                  <p className="text-3xl font-black text-blue-500">{stats.totalSpins}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b">
                <h3 className="font-bold">Danh sách khách hàng mới nhất</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Tên</th>
                      <th className="px-6 py-4">SĐT</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Lượt</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats?.leads.map((l: any) => (
                      <tr key={l.id}>
                        <td className="px-6 py-4 font-medium">{l.name}</td>
                        <td className="px-6 py-4">{l.phone}</td>
                        <td className="px-6 py-4">{l.email}</td>
                        <td className="px-6 py-4">{l.spins_remaining}</td>
                        <td className="px-6 py-4 text-gray-400">{new Date(l.created_at).toLocaleDateString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold mb-4">Cấu hình giải thưởng (Odds)</h3>
              <div className="space-y-4">
                {editOdds.map((prize, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4 items-center">
                    <input 
                      type="text" 
                      value={prize.name} 
                      onChange={e => {
                        const newOdds = [...editOdds];
                        newOdds[i].name = e.target.value;
                        setEditOdds(newOdds);
                      }}
                      className="px-3 py-2 border rounded-lg text-sm"
                      placeholder="Tên giải"
                    />
                    <input 
                      type="number" 
                      value={prize.weight} 
                      onChange={e => {
                        const newOdds = [...editOdds];
                        newOdds[i].weight = parseInt(e.target.value);
                        setEditOdds(newOdds);
                      }}
                      className="px-3 py-2 border rounded-lg text-sm"
                      placeholder="Tỷ lệ (weight)"
                    />
                    <input 
                      type="color" 
                      value={prize.color} 
                      onChange={e => {
                        const newOdds = [...editOdds];
                        newOdds[i].color = e.target.value;
                        setEditOdds(newOdds);
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold mb-4">Cấu hình đường link</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Link Fanpage</label>
                  <input 
                    type="text" 
                    value={editLinks.fanpage || ''} 
                    onChange={e => setEditLinks({...editLinks, fanpage: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Link Zalo OA</label>
                  <input 
                    type="text" 
                    value={editLinks.zalo_oa || ''} 
                    onChange={e => setEditLinks({...editLinks, zalo_oa: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Link "Dùng ngay" (Shopee/Lazada...)</label>
                  <input 
                    type="text" 
                    value={editLinks.use_now || ''} 
                    onChange={e => setEditLinks({...editLinks, use_now: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold mb-4">Cấu hình chống gian lận (Anti-Fraud)</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">Cộng lượt khi nhấn Chia sẻ</p>
                    <p className="text-xs text-gray-400">Nếu tắt, người dùng chỉ được cộng lượt khi bạn bè đăng ký thành công.</p>
                  </div>
                  <button 
                    onClick={() => setEditAntiFraud({...editAntiFraud, reward_on_share_click: !editAntiFraud.reward_on_share_click})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${editAntiFraud.reward_on_share_click ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${editAntiFraud.reward_on_share_click ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Số lượt cộng khi mời bạn bè thành công</label>
                  <input 
                    type="number" 
                    value={editAntiFraud.referral_reward_spins || 0} 
                    onChange={e => setEditAntiFraud({...editAntiFraud, referral_reward_spins: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold mb-4">Thương hiệu (Brand)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tên thương hiệu</label>
                  <input 
                    type="text" 
                    value={editBrand.name} 
                    onChange={e => setEditBrand({...editBrand, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">URL Logo</label>
                  <input 
                    type="text" 
                    value={editBrand.logo} 
                    onChange={e => setEditBrand({...editBrand, logo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  {editBrand.logo && (
                    <img src={editBrand.logo} alt="Preview" className="mt-2 h-10 object-contain" referrerPolicy="no-referrer" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold mb-4">Thời gian kết thúc</h3>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ngày kết thúc chương trình</label>
                <input 
                  type="datetime-local" 
                  value={editCountdownEnd} 
                  onChange={e => setEditCountdownEnd(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg"
            >
              Lưu tất cả cài đặt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showPrize, setShowPrize] = useState<{ name: string, code?: string } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ topReferrers: any[], recentWinners: any[] }>({ topReferrers: [], recentWinners: [] });
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [settings, setSettings] = useState<{ odds: Prize[], links: any, antiFraud: any, brand: any, countdownEnd: string | null }>({ 
    odds: [], 
    links: {},
    antiFraud: { reward_on_share_click: false, referral_reward_spins: 2 },
    brand: { name: 'LUCKY WHEEL', logo: '' },
    countdownEnd: null
  });

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);

    // Load user from localStorage
    const savedUserId = localStorage.getItem('lucky_wheel_user_id');
    if (savedUserId) {
      fetchUser(savedUserId);
    } else {
      setShowLogin(true);
    }

    fetchLeaderboard();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await axios.get('/api/settings');
    setSettings(res.data);
  };

  const fetchUser = async (id: string) => {
    try {
      const res = await axios.get(`/api/user/${id}`);
      setUser(res.data);
    } catch (e) {
      localStorage.removeItem('lucky_wheel_user_id');
      setShowLogin(true);
    }
  };

  const fetchLeaderboard = async () => {
    const res = await axios.get('/api/leaderboard');
    setLeaderboard(res.data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/register', {
        ...formData,
        referredByCode: referralCode
      });
      setUser(res.data);
      localStorage.setItem('lucky_wheel_user_id', res.data.id);
      setShowLogin(false);
    } catch (err) {
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleSpin = async () => {
    if (!user || user.spins_remaining <= 0 || isSpinning) return;

    setIsSpinning(true);
    try {
      // Simulate delay for animation
      setTimeout(async () => {
        const res = await axios.post('/api/spin', { userId: user.id });
        const { prize, voucherCode } = res.data;
        
        setIsSpinning(false);
        setShowPrize({ name: prize, code: voucherCode });
        
        if (prize !== "Chúc may mắn") {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF6B35', '#FFFFFF']
          });
        }
        
        // Refresh user data
        fetchUser(user.id);
        fetchLeaderboard();
      }, 4000);
    } catch (err) {
      setIsSpinning(false);
      alert("Không thể thực hiện lượt quay.");
    }
  };

  const handleAction = async (type: 'share' | 'invite' | 'follow') => {
    if (!user) return;
    
    try {
      if (type === 'share') {
        setShowShareModal(true);
      } else if (type === 'invite') {
        const shareUrl = `${window.location.origin}?ref=${user.referral_code}`;
        navigator.clipboard.writeText(shareUrl);
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2000);
      } else if (type === 'follow') {
        await axios.post('/api/action/follow', { userId: user.id });
        alert("Cảm ơn bạn đã quan tâm! Bạn nhận được +1 lượt quay.");
        fetchUser(user.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 relative">
      {/* Header */}
      <header className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block mb-2"
        >
          {settings.brand.logo ? (
            <img 
              src={settings.brand.logo} 
              alt="Logo" 
              className="h-16 mx-auto mb-2 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-2">
              <Trophy size={32} />
            </div>
          )}
        </motion.div>
        <h1 className="text-3xl font-black text-yellow-300 drop-shadow-md uppercase tracking-tighter italic">
          {settings.brand.name}
        </h1>
        <p className="text-white/90 text-sm font-medium">Quay là trúng - Quà cực khủng!</p>
        <div className="mt-4 flex justify-center">
          <Countdown endTime={settings.countdownEnd} />
        </div>
      </header>

      {/* Main Game Area */}
      <main className="bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-red-600 px-4 py-1 rounded-full font-bold text-sm shadow-inner">
            <Trophy size={16} />
            Lượt quay còn lại: {user?.spins_remaining || 0}
          </div>
        </div>

        <LuckyWheel 
          onSpinComplete={handleSpin} 
          spinsRemaining={user?.spins_remaining || 0}
          isSpinning={isSpinning}
          prizes={settings.odds}
        />

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleAction('share')}
            className="flex flex-col items-center gap-1 bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-colors border border-white/10"
          >
            <Share2 className="text-blue-300" />
            <span className="text-[10px] font-bold uppercase">Chia sẻ {settings.antiFraud.reward_on_share_click ? '(+1)' : ''}</span>
          </button>
          <button 
            onClick={() => handleAction('invite')}
            className="flex flex-col items-center gap-1 bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-colors border border-white/10"
          >
            <UserPlus className="text-green-300" />
            <span className="text-[10px] font-bold uppercase">Mời bạn (+{settings.antiFraud.referral_reward_spins})</span>
          </button>
          <button 
            onClick={() => {
              if (settings.links.fanpage) window.open(settings.links.fanpage, '_blank');
              handleAction('follow');
            }}
            className="flex flex-col items-center gap-1 bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-colors border border-white/10"
          >
            <Heart className="text-pink-300" />
            <span className="text-[10px] font-bold uppercase">Follow (+1)</span>
          </button>
          <button 
            onClick={() => {
              if (settings.links.zalo_oa) window.open(settings.links.zalo_oa, '_blank');
              handleAction('follow');
            }}
            className="flex flex-col items-center gap-1 bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-colors border border-white/10"
          >
            <Bell className="text-yellow-300" />
            <span className="text-[10px] font-bold uppercase">Zalo OA (+1)</span>
          </button>
        </div>
      </main>

      {/* Leaderboard */}
      <section className="bg-white rounded-3xl p-6 text-gray-800 shadow-xl mb-8">
        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <Trophy className="text-yellow-500" />
          <h2 className="font-bold text-lg">Bảng Xếp Hạng Viral</h2>
        </div>
        
        <div className="space-y-4">
          {leaderboard.topReferrers.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold ${i === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-100'}`}>
                  {i + 1}
                </span>
                <span className="font-medium">{item.name}</span>
              </div>
              <span className="text-gray-500">{item.invite_count} bạn bè</span>
            </div>
          ))}
          {leaderboard.topReferrers.length === 0 && (
            <p className="text-center text-gray-400 py-4 italic">Chưa có dữ liệu xếp hạng</p>
          )}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="text-center text-white/60 text-xs pb-12">
        <p>© 2026 Vòng Quay May Mắn. All rights reserved.</p>
        <p className="mt-1">Mỗi tài khoản chỉ được tham gia 1 lần mặc định.</p>
        <button 
          onClick={() => setShowAdmin(true)}
          className="mt-4 opacity-20 hover:opacity-100 transition-opacity"
        >
          Admin Panel
        </button>
      </footer>

      {/* Social Proof */}
      <SocialProof />

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm text-gray-800 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="text-orange-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold">Đăng Nhập Ngay</h2>
                <p className="text-gray-500 text-sm">Nhận ngay 1 lượt quay miễn phí!</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Họ và tên</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Số điện thoại</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="0901234567"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                  <input 
                    required
                    type="email" 
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all transform active:scale-95"
                >
                  BẮT ĐẦU NGAY
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-[10px] text-gray-400">Hoặc đăng nhập với</p>
                <button className="mt-2 flex items-center justify-center gap-2 w-full border border-blue-100 py-2 rounded-xl text-blue-600 font-medium text-sm hover:bg-blue-50">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png" className="w-5 h-5" alt="Zalo" />
                  Zalo Open Platform
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 w-full max-w-sm text-gray-800 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Chia Sẻ Ngay</h2>
                <p className="text-gray-500 text-sm">Lan tỏa niềm vui đến mọi người!</p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                <button 
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}?ref=${user?.referral_code}`);
                    const text = encodeURIComponent('Tham gia quay thưởng nhận voucher cực khủng!');
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                    axios.post('/api/action/share', { userId: user?.id }).then(() => fetchUser(user?.id || ''));
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-[#1877F2] rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Facebook size={24} />
                  </div>
                  <span className="text-[10px] font-medium">Facebook</span>
                </button>
                <button 
                  onClick={() => {
                    const url = encodeURIComponent(`${window.location.origin}?ref=${user?.referral_code}`);
                    window.open(`https://zalo.me/share?url=${url}`, '_blank');
                    axios.post('/api/action/share', { userId: user?.id }).then(() => fetchUser(user?.id || ''));
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-[#0068FF] rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden p-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png" className="w-full h-full object-contain brightness-0 invert" alt="Zalo" />
                  </div>
                  <span className="text-[10px] font-medium">Zalo</span>
                </button>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}?ref=${user?.referral_code}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Vòng Quay May Mắn',
                        text: 'Tham gia quay thưởng nhận voucher cực khủng!',
                        url: url,
                      }).then(() => {
                        axios.post('/api/action/share', { userId: user?.id }).then(() => fetchUser(user?.id || ''));
                      });
                    } else {
                      const fbUrl = encodeURIComponent(url);
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`, '_blank');
                    }
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-gradient-to-tr from-[#0084FF] to-[#A033FF] rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <MessageCircle size={24} />
                  </div>
                  <span className="text-[10px] font-medium">Messenger</span>
                </button>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}?ref=${user?.referral_code}`;
                    navigator.clipboard.writeText(url);
                    setCopyToast(true);
                    setTimeout(() => setCopyToast(false), 2000);
                    axios.post('/api/action/share', { userId: user?.id }).then(() => fetchUser(user?.id || ''));
                  }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600 shadow-lg">
                    <Copy size={24} />
                  </div>
                  <span className="text-[10px] font-medium">Copy Link</span>
                </button>
              </div>

              <button 
                onClick={() => setShowShareModal(false)}
                className="w-full bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-all active:scale-95"
              >
                ĐÓNG
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy Toast */}
      <AnimatePresence>
        {copyToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-[200] flex items-center gap-2"
          >
            <Check size={16} className="text-green-400" />
            Đã copy link thành công!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prize Modal */}
      <AnimatePresence>
        {showPrize && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm text-center relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-200 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-200 rounded-full blur-3xl opacity-50" />

              <button 
                onClick={() => setShowPrize(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>

              {showPrize.name === "Chúc may mắn" ? (
                <>
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="text-gray-400" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Tiếc quá!</h2>
                  <p className="text-gray-500 mb-8">Bạn chưa may mắn lần này. Hãy mời thêm bạn bè để nhận thêm lượt quay nhé!</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <Trophy className="text-yellow-600" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Chúc Mừng!</h2>
                  <p className="text-gray-500 mb-4">Bạn đã trúng phần thưởng:</p>
                  <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl p-4 mb-6">
                    <span className="text-2xl font-black text-orange-600 uppercase">{showPrize.name}</span>
                  </div>
                  
                  {showPrize.code && (
                    <div className="mb-8">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Mã voucher của bạn</p>
                      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <code className="flex-1 font-mono text-lg font-bold text-gray-700">{showPrize.code}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(showPrize.code!);
                            alert("Đã copy mã voucher!");
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Copy size={18} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowPrize(null);
                    handleAction('invite');
                  }}
                  className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  MỜI BẠN NHẬN +{settings.antiFraud.referral_reward_spins} LƯỢT <ChevronRight size={18} />
                </button>
                {showPrize.name !== "Chúc may mắn" && (
                  <button 
                    onClick={() => window.open(settings.links.use_now || 'https://shopee.vn', '_blank')}
                    className="w-full bg-white border-2 border-orange-500 text-orange-500 font-bold py-3 rounded-xl hover:bg-orange-50 transition-all"
                  >
                    DÙNG NGAY
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} onSettingsUpdate={fetchSettings} />}
    </div>
  );
}
