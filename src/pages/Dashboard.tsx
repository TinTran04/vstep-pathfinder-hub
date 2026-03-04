import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart3, BookOpen, Clock, TrendingUp, Award, ChevronRight,
  Headphones, BookOpenCheck, Pen, Mic, LogOut, Home, FileText, Settings, User,
  Flame, Gift, Share2, Star, Zap, Trophy, Copy, Check, Camera, Mail, Lock,
  ShoppingBag, Sparkles, Crown, Ticket, CreditCard, RotateCcw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const skillColors: Record<string, string> = {
  Listening: "bg-blue-500",
  Reading: "bg-emerald-500",
  Writing: "bg-amber-500",
  Speaking: "bg-purple-500",
};

const skillIcons: Record<string, React.ReactNode> = {
  Listening: <Headphones size={20} />,
  Reading: <BookOpenCheck size={20} />,
  Writing: <Pen size={20} />,
  Speaking: <Mic size={20} />,
};

const recentScores = [
  { skill: "Listening", test: "Đề thi thử #5", score: 7.5, total: 10, date: "28/02/2026" },
  { skill: "Reading", test: "Đề thi thử #3", score: 8, total: 10, date: "27/02/2026" },
  { skill: "Writing", test: "Task 2 - Essay", score: 6.5, total: 10, date: "26/02/2026" },
  { skill: "Speaking", test: "Part 3 - Discussion", score: 7, total: 10, date: "25/02/2026" },
];

const weeklyData = [
  { day: "T2", hours: 1.5 },
  { day: "T3", hours: 2 },
  { day: "T4", hours: 0.5 },
  { day: "T5", hours: 2.5 },
  { day: "T6", hours: 1 },
  { day: "T7", hours: 3 },
  { day: "CN", hours: 2 },
];

const streakDays = [true, true, true, true, true, true, true, true, true, true, true, true, false, false];

const pointActions = [
  { action: "Hoàn thành 1 bài học", points: 10, icon: BookOpen },
  { action: "Hoàn thành 1 đề thi", points: 25, icon: FileText },
  { action: "Đạt điểm ≥ 7.0", points: 15, icon: Star },
  { action: "Duy trì streak 7 ngày", points: 50, icon: Flame },
  { action: "Chia sẻ website", points: 30, icon: Share2 },
  { action: "Mời bạn bè đăng ký", points: 100, icon: Gift },
];

// Rewards store - from low to high, with monthly limits
const rewardsStore = [
  { id: 1, name: "Badge 'Người mới'", description: "Huy hiệu hiển thị trên hồ sơ", cost: 50, icon: Award, category: "badge", emoji: "🏅", monthlyLimit: 1 },
  { id: 2, name: "1 đề thi Premium", description: "Mở khóa 1 đề thi nâng cao", cost: 100, icon: FileText, category: "test", emoji: "📝", monthlyLimit: 5 },
  { id: 3, name: "Badge 'Chăm chỉ'", description: "Huy hiệu học viên chăm chỉ", cost: 200, icon: Star, category: "badge", emoji: "⭐", monthlyLimit: 1 },
  { id: 4, name: "3 lượt chấm AI Writing", description: "Chấm bài viết bằng AI", cost: 300, icon: Sparkles, category: "ai", emoji: "🤖", monthlyLimit: 3 },
  { id: 5, name: "Giảm 10% gói Tháng", description: "Mã giảm giá cho gói Premium", cost: 500, icon: Ticket, category: "discount", emoji: "🎫", monthlyLimit: 2 },
  { id: 6, name: "1 tuần Premium miễn phí", description: "Trải nghiệm Premium 7 ngày", cost: 800, icon: Crown, category: "premium", emoji: "👑", monthlyLimit: 1 },
  { id: 7, name: "Badge 'Chiến binh VSTEP'", description: "Huy hiệu cực hiếm", cost: 1000, icon: Trophy, category: "badge", emoji: "🏆", monthlyLimit: 1 },
  { id: 8, name: "AI Writing không giới hạn (1 tháng)", description: "Chấm bài không giới hạn trong 30 ngày", cost: 1500, icon: Sparkles, category: "ai", emoji: "✨", monthlyLimit: 1 },
  { id: 9, name: "Giảm 30% gói Năm", description: "Mã giảm giá lớn cho gói Premium", cost: 2000, icon: CreditCard, category: "discount", emoji: "💳", monthlyLimit: 1 },
  { id: 10, name: "VIP Lifetime Badge", description: "Huy hiệu VIP vĩnh viễn trên hồ sơ", cost: 3000, icon: Crown, category: "badge", emoji: "💎", monthlyLimit: 1 },
];

type TabType = "overview" | "rewards" | "settings";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const maxHours = Math.max(...weeklyData.map((d) => d.hours));
  const [shareDialog, setShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalPoints, setTotalPoints] = useState(user?.points ?? 350);
  const [showPointAnim, setShowPointAnim] = useState(false);
  const [pointDelta, setPointDelta] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [redeemDialog, setRedeemDialog] = useState<typeof rewardsStore[0] | null>(null);
  const [redeemedIds, setRedeemedIds] = useState<number[]>([]);
  // Track monthly redemption counts: { rewardId: count }
  const [monthlyRedeemCounts, setMonthlyRedeemCounts] = useState<Record<number, number>>({});

  // Settings state
  const [settingsName, setSettingsName] = useState(user?.name ?? "Nguyễn Văn A");
  const [settingsEmail, setSettingsEmail] = useState(user?.email ?? "nguyenvana@gmail.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? "");

  const currentStreak = user?.streak ?? 12;
  const shareUrl = "https://vstep-pathfinder-hub.lovable.app";

  const handleShare = (platform: string) => {
    if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "zalo") {
      window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`, "_blank");
    }
    addPoints(30);
    toast.success("🎉 +30 điểm thưởng khi chia sẻ!");
  };

  const addPoints = (pts: number) => {
    setPointDelta(pts);
    setShowPointAnim(true);
    setTimeout(() => {
      setTotalPoints((p) => p + pts);
      setShowPointAnim(false);
    }, 1000);
  };

  const handleRedeem = (reward: typeof rewardsStore[0]) => {
    if (totalPoints < reward.cost) {
      toast.error("Bạn không đủ điểm để đổi phần thưởng này!");
      return;
    }
    const currentCount = monthlyRedeemCounts[reward.id] || 0;
    if (currentCount >= reward.monthlyLimit) {
      toast.error(`Bạn đã đạt giới hạn ${reward.monthlyLimit} lượt/tháng cho phần thưởng này!`);
      return;
    }
    setTotalPoints((p) => p - reward.cost);
    setMonthlyRedeemCounts(prev => ({ ...prev, [reward.id]: currentCount + 1 }));
    setRedeemedIds((prev) => [...prev, reward.id]);
    setRedeemDialog(null);
    toast.success(`🎉 Đã đổi thành công: ${reward.name}! (${currentCount + 1}/${reward.monthlyLimit} lượt tháng này)`);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setAvatarPreview(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateUser({ name: settingsName, email: settingsEmail, avatar: avatarPreview });
    toast.success("✅ Đã cập nhật thông tin!");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("✅ Đã đổi mật khẩu thành công!");
  };

  const sidebarItems = [
    { icon: <BarChart3 size={20} />, label: "Tổng quan", tab: "overview" as TabType },
    { icon: <ShoppingBag size={20} />, label: "Đổi thưởng", tab: "rewards" as TabType },
    { icon: <Settings size={20} />, label: "Cài đặt", tab: "settings" as TabType },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-extrabold text-lg">V</span>
            </div>
            <span className="font-bold text-xl text-foreground">VSTEP<span className="text-gradient">Pro</span></span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.tab
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-border mt-2">
            <Link
              to="/quiz"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <BookOpen size={20} />
              Luyện tập
            </Link>
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <Home size={20} />
              Trang chủ
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-9 h-9">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt={settingsName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {settingsName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{settingsName}</p>
              <p className="text-xs text-muted-foreground">{user?.plan ?? "Gói Nâng cao"}</p>
            </div>
            <button onClick={() => { logout(); navigate("/"); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">V</span>
            </div>
            <span className="font-bold text-lg text-foreground">VSTEPPro</span>
          </Link>
          <div className="flex items-center gap-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.label}
                variant={activeTab === item.tab ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(item.tab)}
                className="gap-1"
              >
                {item.icon}
                <span className="hidden sm:inline text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
          {activeTab === "overview" && <OverviewTab
            totalPoints={totalPoints}
            currentStreak={currentStreak}
            showPointAnim={showPointAnim}
            pointDelta={pointDelta}
            maxHours={maxHours}
            weeklyData={weeklyData}
            streakDays={streakDays}
            pointActions={pointActions}
            recentScores={recentScores}
            skillColors={skillColors}
            skillIcons={skillIcons}
            settingsName={settingsName}
            setShareDialog={setShareDialog}
            addPoints={addPoints}
          />}

          {activeTab === "rewards" && <RewardsTab
            totalPoints={totalPoints}
            redeemedIds={redeemedIds}
            monthlyRedeemCounts={monthlyRedeemCounts}
            setRedeemDialog={setRedeemDialog}
          />}

          {activeTab === "settings" && <SettingsTab
            settingsName={settingsName}
            setSettingsName={setSettingsName}
            settingsEmail={settingsEmail}
            setSettingsEmail={setSettingsEmail}
            avatarPreview={avatarPreview}
            handleAvatarChange={handleAvatarChange}
            handleSaveProfile={handleSaveProfile}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            handleChangePassword={handleChangePassword}
          />}
        </div>
      </main>

      {/* Share Dialog */}
      <Dialog open={shareDialog} onOpenChange={setShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 size={20} className="text-primary" />
              Chia sẻ & nhận thưởng
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chia sẻ VSTEPPro với bạn bè và nhận <strong className="text-amber-600">30 điểm thưởng</strong> mỗi lần chia sẻ!
            </p>
            <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
              <input readOnly value={shareUrl} className="flex-1 bg-transparent text-sm text-foreground outline-none" />
              <Button size="sm" variant="ghost" onClick={() => handleShare("copy")} className="shrink-0">
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2" onClick={() => handleShare("facebook")}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-600"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => handleShare("zalo")}>
                <span className="w-4 h-4 rounded bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">Z</span>
                Zalo
              </Button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-sm font-medium text-amber-800">💰 Mời bạn bè đăng ký → <strong>+100 điểm/người</strong></p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={!!redeemDialog} onOpenChange={() => setRedeemDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary" />
              Xác nhận đổi thưởng
            </DialogTitle>
          </DialogHeader>
          {redeemDialog && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <span className="text-5xl">{redeemDialog.emoji}</span>
                <h3 className="text-lg font-bold text-foreground mt-3">{redeemDialog.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{redeemDialog.description}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chi phí</span>
                <span className="text-lg font-bold text-amber-600 flex items-center gap-1">
                  <Zap size={18} /> {redeemDialog.cost} điểm
                </span>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Điểm hiện tại</span>
                <span className={`text-lg font-bold ${totalPoints >= redeemDialog.cost ? "text-emerald-600" : "text-destructive"}`}>
                  {totalPoints} điểm
                </span>
              </div>
              {totalPoints < redeemDialog.cost && (
                <p className="text-sm text-destructive text-center">
                  Bạn cần thêm <strong>{redeemDialog.cost - totalPoints}</strong> điểm nữa
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setRedeemDialog(null)}>Hủy</Button>
                <Button
                  onClick={() => handleRedeem(redeemDialog)}
                  disabled={totalPoints < redeemDialog.cost}
                  className="gradient-primary text-primary-foreground gap-1"
                >
                  <ShoppingBag size={16} />
                  Đổi ngay
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ──────────────── OVERVIEW TAB ──────────────── */
const OverviewTab = ({
  totalPoints, currentStreak, showPointAnim, pointDelta, maxHours,
  weeklyData, streakDays, pointActions, recentScores, skillColors, skillIcons,
  settingsName, setShareDialog, addPoints,
}: any) => (
  <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Xin chào, {settingsName} 👋</h1>
      <p className="text-muted-foreground mt-1">Tiếp tục hành trình chinh phục VSTEP của bạn</p>
    </motion.div>

    {/* Stats cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { icon: <Clock size={20} />, label: "Giờ học tuần này", value: "12.5h", color: "text-primary" },
        { icon: <BookOpen size={20} />, label: "Bài đã hoàn thành", value: "24/60", color: "text-emerald-500" },
        { icon: <Zap size={20} />, label: "Điểm thưởng", value: `${totalPoints}`, color: "text-amber-500", isPoints: true },
        { icon: <Flame size={20} />, label: "Chuỗi ngày học", value: `${currentStreak} ngày`, color: "text-orange-500", isStreak: true },
      ].map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}>
          <Card className="border-border card-press cursor-default group hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-4 lg:p-5">
              <div className={`${s.color} mb-2 flex items-center gap-2`}>
                {(s as any).isStreak ? <span className="animate-fire">{s.icon}</span> : s.icon}
              </div>
              <div className="relative">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <AnimatePresence>
                  {(s as any).isPoints && showPointAnim && (
                    <motion.span className="absolute -top-4 right-0 text-sm font-bold text-amber-500"
                      initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -20 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
                      +{pointDelta}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>

    {/* Streak + Points */}
    <div className="grid lg:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame size={20} className="text-orange-500 animate-fire" />
              Chuỗi ngày học liên tiếp
              <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200 text-xs">🔥 {currentStreak} ngày</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mt-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <span key={d} className="text-xs text-muted-foreground text-center font-medium">{d}</span>
              ))}
              {streakDays.map((active: boolean, i: number) => (
                <motion.div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${active ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                  {active ? "🔥" : i + 1}
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Duy trì streak 7 ngày liên tiếp → <strong className="text-amber-600">+50 điểm thưởng</strong>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" /> Điểm thưởng
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Zap size={16} className="text-amber-500" />
                <span className="text-lg font-bold text-foreground">{totalPoints}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cách kiếm điểm</p>
              {pointActions.slice(0, 4).map((pa: any) => (
                <div key={pa.action} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <pa.icon size={14} className="text-primary" />
                  </div>
                  <span className="flex-1 text-muted-foreground">{pa.action}</span>
                  <Badge variant="secondary" className="text-xs font-bold text-amber-600">+{pa.points}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5 gap-2" onClick={() => setShareDialog(true)}>
              <Share2 size={16} /> Chia sẻ & nhận 30 điểm
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>

    {/* Chart + Skills */}
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Thời gian học trong tuần
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-40 mt-4">
            {weeklyData.map((d: any, i: number) => (
              <motion.div key={d.day} className="flex-1 flex flex-col items-center gap-2"
                initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }} style={{ transformOrigin: "bottom" }}>
                <span className="text-xs font-medium text-muted-foreground">{d.hours}h</span>
                <div className="w-full bg-muted rounded-t-lg overflow-hidden" style={{ height: "100%" }}>
                  <div className="w-full gradient-primary rounded-t-lg transition-all duration-500"
                    style={{ height: `${(d.hours / maxHours) * 100}%`, marginTop: "auto" }} />
                </div>
                <span className="text-xs text-muted-foreground">{d.day}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Tiến độ kỹ năng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { skill: "Listening", progress: 72 },
            { skill: "Reading", progress: 65 },
            { skill: "Writing", progress: 45 },
            { skill: "Speaking", progress: 58 },
          ].map((s) => (
            <div key={s.skill} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${skillColors[s.skill]}`} />
                  <span className="font-medium text-foreground">{s.skill}</span>
                </div>
                <span className="text-muted-foreground">{s.progress}%</span>
              </div>
              <Progress value={s.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>

    {/* Recent scores */}
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Kết quả gần đây</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">Xem tất cả <ChevronRight size={16} /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {recentScores.map((r: any, i: number) => (
            <motion.div key={i} className="flex items-center gap-4 py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}>
              <div className={`w-10 h-10 rounded-xl ${skillColors[r.skill]} bg-opacity-10 flex items-center justify-center text-foreground`}>
                {skillIcons[r.skill]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.test}</p>
                <p className="text-xs text-muted-foreground">{r.skill} · {r.date}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{r.score}<span className="text-sm text-muted-foreground">/{r.total}</span></p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  </>
);

/* ──────────────── REWARDS STORE TAB ──────────────── */
const RewardsTab = ({ totalPoints, redeemedIds, setRedeemDialog }: any) => (
  <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Đổi phần thưởng 🎁</h1>
      <p className="text-muted-foreground mt-1">Dùng điểm thưởng để đổi các phần thưởng hấp dẫn</p>
    </motion.div>

    {/* Points banner */}
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <Card className="border-border gradient-primary text-primary-foreground">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Điểm thưởng hiện tại</p>
            <p className="text-4xl font-bold mt-1 flex items-center gap-2"><Zap size={28} /> {totalPoints}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Tổng đã đổi</p>
            <p className="text-2xl font-bold mt-1">{redeemedIds.length} phần thưởng</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>

    {/* Rewards grid */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rewardsStore.map((reward, i) => {
        const isRedeemed = redeemedIds.includes(reward.id);
        const canAfford = totalPoints >= reward.cost;
        return (
          <motion.div key={reward.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}>
            <Card className={`border-border transition-all duration-300 hover:border-primary/30 ${isRedeemed ? "opacity-60" : "card-press"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{reward.emoji}</span>
                  {isRedeemed && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                      <Check size={12} className="mr-1" /> Đã đổi
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-foreground">{reward.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                    <Zap size={14} /> {reward.cost} điểm
                  </span>
                  <Button
                    size="sm"
                    variant={canAfford && !isRedeemed ? "default" : "outline"}
                    disabled={isRedeemed}
                    onClick={() => !isRedeemed && setRedeemDialog(reward)}
                    className={canAfford && !isRedeemed ? "gradient-primary text-primary-foreground" : ""}
                  >
                    {isRedeemed ? "Đã đổi" : canAfford ? "Đổi ngay" : "Chưa đủ điểm"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  </>
);

/* ──────────────── SETTINGS TAB ──────────────── */
const SettingsTab = ({
  settingsName, setSettingsName, settingsEmail, setSettingsEmail,
  avatarPreview, handleAvatarChange, handleSaveProfile,
  currentPassword, setCurrentPassword, newPassword, setNewPassword,
  confirmPassword, setConfirmPassword, handleChangePassword,
}: any) => (
  <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Cài đặt tài khoản ⚙️</h1>
      <p className="text-muted-foreground mt-1">Quản lý thông tin cá nhân và bảo mật</p>
    </motion.div>

    <div className="grid lg:grid-cols-2 gap-6">
      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><User size={20} className="text-primary" /> Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="w-20 h-20">
                  {avatarPreview ? <AvatarImage src={avatarPreview} alt="Avatar" /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {settingsName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={20} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Ảnh đại diện</p>
                <p className="text-xs text-muted-foreground">Nhấn vào ảnh để thay đổi</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input id="name" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1"><Mail size={14} /> Email</Label>
              <Input id="email" type="email" value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} />
            </div>

            <Button onClick={handleSaveProfile} className="w-full gradient-primary text-primary-foreground">
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Lock size={20} className="text-primary" /> Đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Mật khẩu hiện tại</Label>
              <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">Mật khẩu mới</Label>
              <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Xác nhận mật khẩu mới</Label>
              <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" />
            </div>
            <Button onClick={handleChangePassword} variant="outline" className="w-full">
              <Lock size={16} className="mr-2" /> Cập nhật mật khẩu
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </>
);

export default Dashboard;
