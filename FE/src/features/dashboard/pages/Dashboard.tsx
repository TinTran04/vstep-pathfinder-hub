import { useState, useEffect } from "react";
import VocabularyNotebook from "../components/VocabularyNotebook";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart3, BookOpen, Clock, TrendingUp, ChevronRight,
  Headphones, BookOpenCheck, Pen, Mic, LogOut, Home, Settings, User,
  Flame, Share2, Zap, Trophy, Copy, Check, Camera, Mail, Lock,
  Sparkles, BookMarked, FileText, Star, Gift, ShoppingBag,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { dashboardService } from "../services/dashboard.service";

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

export interface ScoreItem {
  skill: string;
  test: string;
  score: number;
  total: number;
  date: string;
}

export interface WeeklyItem {
  day: string;
  hours: number;
}

export interface PointActionItem {
  action: string;
  points: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export interface DashboardData {
  recentScores: ScoreItem[];
  weeklyData: WeeklyItem[];
  streakDays: boolean[];
  pointActions: PointActionItem[];
}

type TabType = "overview" | "rewards" | "settings" | "vocabulary";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout, changePassword, isInitialising, isLoggedIn } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[FE-PERF] dashboard mounted");
      const startTimeStr = sessionStorage.getItem("login_start_time");
      if (startTimeStr) {
        const elapsed = Date.now() - parseInt(startTimeStr, 10);
        console.log(`[FE-PERF] Time from login submit to dashboard mounted: ${elapsed}ms`);
      }
    }
  }, []);

  useEffect(() => {
    if (isInitialising) return;

    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để tiếp tục.");
      navigate("/auth");
      return;
    }

    let isMounted = true;
    dashboardService.getDashboardData().then((data) => {
      if (isMounted) {
        if (import.meta.env.DEV) {
          console.log("[FE-PERF] dashboard data loaded");
          const startTimeStr = sessionStorage.getItem("login_start_time");
          if (startTimeStr) {
            const elapsed = Date.now() - parseInt(startTimeStr, 10);
            console.log(`[FE-PERF] LOGIN_TOTAL_FE: ${elapsed}ms (from login submit to dashboard data loaded)`);
            sessionStorage.removeItem("login_start_time");
            try {
              console.timeEnd("LOGIN_TOTAL_FE");
            } catch (e) {}
          }
        }
        setDashboardData(data);
        setLoading(false);
      }
    }).catch((err) => {
      console.error(err);
      if (isMounted) {
        toast.error("Không thể kết nối đến máy chủ.");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isInitialising, isLoggedIn, navigate]);

  const weeklyData = dashboardData?.weeklyData || [];
  const recentScores = dashboardData?.recentScores || [];
  const pointActions = dashboardData?.pointActions || [];

  // Tạo streakDays từ streak thật của user (không dùng mock)
  // Hiển thị 14 ngày: đánh dấu N ngày cuối là active (= streak count)
  const currentStreak = user?.streak ?? 0;
  const STREAK_DISPLAY = 14;
  const streakDays: boolean[] = Array.from({ length: STREAK_DISPLAY }, (_, i) => {
    const dayFromEnd = STREAK_DISPLAY - 1 - i;
    return dayFromEnd < currentStreak;
  });

  const maxHours = weeklyData.length > 0 ? Math.max(...weeklyData.map((d: WeeklyItem) => d.hours)) : 0;
  const [shareDialog, setShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalPoints, setTotalPoints] = useState(user?.points ?? 0);
  const [showPointAnim, setShowPointAnim] = useState(false);
  const [pointDelta, setPointDelta] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Settings state
  const [settingsName, setSettingsName] = useState(user?.name ?? "");
  const [settingsEmail, setSettingsEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? "");

  const shareUrl = "https://vstep-pathfinder-hub.lovable.app";

  // Sync totalPoints when user data changes (e.g. after login or refresh)
  useEffect(() => {
    if (user?.points !== undefined) {
      setTotalPoints(user.points);
    }
  }, [user?.points]);

  // Sync settings fields when user data loads
  useEffect(() => {
    if (user) {
      setSettingsName(user.name || "");
      setSettingsEmail(user.email || "");
      setAvatarPreview(user.avatar || "");
    }
  }, [user?.name, user?.email, user?.avatar]);

  if (isInitialising) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải cấu hình phiên học...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

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

  const handleRedeem = (_reward: unknown) => {
    // Feature coming soon
    toast.info("Tính năng đổi điểm đang được phát triển!");
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

  const handleChangePassword = async () => {
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

    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("✅ Đã đổi mật khẩu thành công!");
      } else {
        toast.error(res.error || "Mật khẩu hiện tại không chính xác!");
      }
    } catch (err) {
      toast.error("Có lỗi kết nối xảy ra!");
    }
  };

  const sidebarItems = [
    { icon: <BarChart3 size={20} />, label: "Tổng quan", tab: "overview" as TabType },
    { icon: <ShoppingBag size={20} />, label: "Đổi thưởng", tab: "rewards" as TabType },
    { icon: <Settings size={20} />, label: "Cài đặt", tab: "settings" as TabType },
    { icon: <BookMarked size={20} />, label: "Sổ tay từ vựng", tab: "vocabulary" as TabType },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col sticky top-0 h-screen">
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
      <main className="flex-1">
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

          {activeTab === "rewards" && <RewardsTab totalPoints={totalPoints} />}

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

          {activeTab === "vocabulary" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <VocabularyNotebook />
            </motion.div>
          )}
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

    </div>
  );
};

/* ──────────────── OVERVIEW TAB ──────────────── */
interface OverviewTabProps {
  totalPoints: number;
  currentStreak: number;
  showPointAnim: boolean;
  pointDelta: number;
  maxHours: number;
  weeklyData: WeeklyItem[];
  streakDays: boolean[];
  pointActions: PointActionItem[];
  recentScores: ScoreItem[];
  skillColors: Record<string, string>;
  skillIcons: Record<string, React.ReactNode>;
  settingsName: string;
  setShareDialog: (open: boolean) => void;
  addPoints: (amount: number) => void;
}

const OverviewTab = ({
  totalPoints, currentStreak, showPointAnim, pointDelta, maxHours,
  weeklyData, streakDays, pointActions, recentScores, skillColors, skillIcons,
  settingsName, setShareDialog, addPoints,
}: OverviewTabProps) => (
  <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Xin chào, {settingsName} 👋</h1>
      <p className="text-muted-foreground mt-1">Tiếp tục hành trình chinh phục VSTEP của bạn</p>
    </motion.div>

    {/* Stats cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {([
        { icon: <Clock size={20} />, label: "Giờ học tuần này", value: "0h", color: "text-primary" },
        { icon: <BookOpen size={20} />, label: "Bài đã hoàn thành", value: "0", color: "text-emerald-500" },
        { icon: <Zap size={20} />, label: "Điểm thưởng", value: `${totalPoints}`, color: "text-amber-500", isPoints: true },
        { icon: <Flame size={20} />, label: "Chuỗi ngày học", value: `${currentStreak} ngày`, color: "text-orange-500", isStreak: true },
      ] as { icon: React.ReactNode; label: string; value: string; color: string; isPoints?: boolean; isStreak?: boolean }[]).map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}>
          <Card className="border-border card-press cursor-default group hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-4 lg:p-5">
              <div className={`${s.color} mb-2 flex items-center gap-2`}>
                {s.isStreak ? <span className="animate-fire">{s.icon}</span> : s.icon}
              </div>
              <div className="relative">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <AnimatePresence>
                  {s.isPoints && showPointAnim && (
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
              {pointActions.slice(0, 4).map((pa: PointActionItem) => (
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
          <div className="h-48 mt-2">
            {weeklyData.length === 0 || weeklyData.every((d: WeeklyItem) => d.hours === 0) ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp size={32} className="opacity-20" />
                <p className="text-sm">Chưa có dữ liệu học tuần này</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="h" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value}h`, "Thời gian học"]}
                  />
                  <Bar dataKey="hours" name="Giờ học" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Tiến độ kỹ năng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { skill: "Listening", progress: 0 },
            { skill: "Reading", progress: 0 },
            { skill: "Writing", progress: 0 },
            { skill: "Speaking", progress: 0 },
          ].map((s) => (
            <div key={s.skill} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${skillColors[s.skill]}`} />
                  <span className="font-medium text-foreground">{s.skill}</span>
                </div>
                <span className="text-muted-foreground text-xs">Chưa có dữ liệu</span>
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
          {recentScores.length > 0 && (
            <Button variant="ghost" size="sm" className="text-primary">Xem tất cả <ChevronRight size={16} /></Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentScores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
            <FileText size={36} className="opacity-20" />
            <p className="text-sm">Chưa có kết quả nào. Hãy bắt đầu luyện tập!</p>
            <Button size="sm" variant="outline" className="mt-1" onClick={() => window.location.href = '/quiz'}>
              Bắt đầu luyện tập ngay
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentScores.map((r: ScoreItem, i: number) => (
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
        )}
      </CardContent>
    </Card>
  </>
);

/* ──────────────── REWARDS STORE TAB ──────────────── */
const RewardsTab = ({ totalPoints }: { totalPoints: number }) => (
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
          <div className="text-right opacity-80">
            <Sparkles size={40} />
          </div>
        </CardContent>
      </Card>
    </motion.div>

    {/* Coming soon */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        className="text-7xl mb-6"
      >
        🚧
      </motion.div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Đang cập nhật</h2>
      <p className="text-muted-foreground max-w-sm">
        Tính năng đổi điểm đang được phát triển và sẽ sớm ra mắt. Hãy tiếp tục tích lũy điểm thưởng nhé!
      </p>
      <div className="mt-8 flex items-center gap-3">
        <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} />
        <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
        <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
      </div>
    </motion.div>
  </>
);

/* ──────────────── SETTINGS TAB ──────────────── */
interface SettingsTabProps {
  settingsName: string;
  setSettingsName: (name: string) => void;
  settingsEmail: string;
  setSettingsEmail: (email: string) => void;
  avatarPreview: string | null;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: () => void;
  currentPassword: string;
  setCurrentPassword: (pw: string) => void;
  newPassword: string;
  setNewPassword: (pw: string) => void;
  confirmPassword: string;
  setConfirmPassword: (pw: string) => void;
  handleChangePassword: () => void;
}

const SettingsTab = ({
  settingsName, setSettingsName, settingsEmail, setSettingsEmail,
  avatarPreview, handleAvatarChange, handleSaveProfile,
  currentPassword, setCurrentPassword, newPassword, setNewPassword,
  confirmPassword, setConfirmPassword, handleChangePassword,
}: SettingsTabProps) => (
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
