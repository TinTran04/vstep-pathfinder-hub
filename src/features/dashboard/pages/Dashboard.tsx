import { useState, useEffect, useRef } from "react";
import VocabularyNotebook from "../components/VocabularyNotebook";
import HistoryTab from "../components/HistoryTab";
import { useNavigate, Link } from "react-router-dom";
import logoImg from "@/assets/logo1.jpg";
import {
  BarChart3, BookOpen, Clock, TrendingUp, ChevronRight,
  Headphones, BookOpenCheck, Pen, Mic, LogOut, Home, Settings, User,
  Flame, Check, Camera, Mail, Lock,
  BookMarked, FileText, Crown, Activity, Navigation,
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
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getAvatarSrc, normalizeAvatarKey, PRESET_AVATARS } from "@/features/auth/avatarCatalog";
import { dashboardService, StreakDayItem, SkillProgressResponse } from "../services/dashboard.service";
import { avatarService, UserAvatarResponse } from "../services/avatar.service";

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

export interface DashboardData {
  recentScores: ScoreItem[];
  weeklyData: WeeklyItem[];
  streakDays: StreakDayItem[];
  weekStudySeconds: number;
  completedCount: number;
  currentStreakDays: number;
  skillProgress: SkillProgressResponse;
}

type TabType = "overview" | "history" | "settings" | "vocabulary";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, changePassword, isInitialising, isLoggedIn } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAvatars, setUserAvatars] = useState<UserAvatarResponse | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const prevUnlockedRef = useRef<string[]>([]);

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
  const streakDays = dashboardData?.streakDays || [];
  const currentStreak = dashboardData?.currentStreakDays ?? user?.streak ?? 0;
  const weekStudySeconds = dashboardData?.weekStudySeconds ?? 0;
  const completedCount = dashboardData?.completedCount ?? 0;
  const skillProgress = dashboardData?.skillProgress;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Settings state
  const [settingsName, setSettingsName] = useState(user?.name ?? "");
  const [settingsEmail, setSettingsEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarKey, setAvatarKey] = useState(normalizeAvatarKey(user?.avatarKey));

  // Sync settings fields when user data loads
  useEffect(() => {
    if (user) {
      setSettingsName(user.name || "");
      setSettingsEmail(user.email || "");
      setAvatarKey(normalizeAvatarKey(user.avatarKey));
    }
  }, [user?.name, user?.email, user?.avatarKey]);

  // Load user avatars when avatar picker opens
  useEffect(() => {
    if (avatarPickerOpen) {
      avatarService.getUserAvatars()
        .then((data) => {
          if (!data) return;
          setUserAvatars(data);

          // Detect newly unlocked avatars for celebration effect
          const prevIds = prevUnlockedRef.current;
          const currentIds = data.unlockedAvatars.map(a => a.avatarId);
          const newOnes = currentIds.filter(id => !prevIds.includes(id) && id !== "avatar1");
          if (newOnes.length > 0 && prevIds.length > 0) {
            setNewlyUnlocked(newOnes);
            // Fire confetti celebration
            import("canvas-confetti").then(({ default: confetti }) => {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
            }).catch(() => {});
            toast.success(`🎉 Mở khóa avatar mới: ${newOnes.map(id => id).join(", ")}!`, { duration: 4000 });
          }
          prevUnlockedRef.current = currentIds;
        })
        .catch((err) => {
          console.error("Failed to load avatars:", err);
        });
    }
  }, [avatarPickerOpen]);

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

  const handleSaveProfile = async () => {
    const result = await updateProfile({ name: settingsName, avatarKey });
    if (result.success) {
      toast.success("Đã cập nhật thông tin!");
    } else {
      toast.error(result.error || "Không thể cập nhật thông tin.");
    }
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
    { icon: <Activity size={20} />, label: "Lịch sử bài làm", tab: "history" as TabType },
    { icon: <Settings size={20} />, label: "Cài đặt", tab: "settings" as TabType },
    { icon: <BookMarked size={20} />, label: "Sổ tay từ vựng", tab: "vocabulary" as TabType },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="VStepUp" className="w-9 h-9 rounded-xl object-contain" />
            <span className="font-bold text-xl text-foreground">VStep<span className="text-gradient">Up</span></span>
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
              <AvatarImage src={getAvatarSrc(avatarKey)} alt={settingsName} />
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
            <img src={logoImg} alt="VStepUp" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-lg text-foreground">VStepUp</span>
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
            currentStreak={currentStreak}
            weeklyData={weeklyData}
            streakDays={streakDays}
            recentScores={recentScores}
            skillColors={skillColors}
            skillIcons={skillIcons}
            settingsName={settingsName}
            userPlan={user?.plan ?? "Miễn phí"}
            weekStudySeconds={weekStudySeconds}
            completedCount={completedCount}
            skillProgress={skillProgress}
          />}

          {activeTab === "settings" && <SettingsTab
            settingsName={settingsName}
            setSettingsName={setSettingsName}
            settingsEmail={settingsEmail}
            avatarKey={avatarKey}
            onOpenAvatarPicker={() => setAvatarPickerOpen(true)}
            handleSaveProfile={handleSaveProfile}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            handleChangePassword={handleChangePassword}
          />}

          {activeTab === "history" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <HistoryTab />
            </motion.div>
          )}

          {activeTab === "vocabulary" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <VocabularyNotebook />
            </motion.div>
          )}
        </div>
      </main>

      <Dialog open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <User size={20} className="text-primary" />
              Chọn ảnh đại diện
            </DialogTitle>
            <p className="text-xs text-muted-foreground pt-1">
              {userAvatars && userAvatars.lockedAvatars.length === 0
                ? "✅ Bạn đã mở khóa avatar yêu thích!"
                : "🔥 Đạt 7 ngày streak liên tiếp để mở khóa thêm 1 avatar bất kỳ."}
            </p>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4 justify-items-center">
            {!userAvatars && (
              <div className="col-span-4 flex items-center justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
            {userAvatars && PRESET_AVATARS.map((avatar) => {
              const isSelected = avatarKey === avatar.id;
              const isLocked = !userAvatars.unlockedAvatars.some(a => a.avatarId === avatar.id);
              const isNewlyUnlocked = newlyUnlocked.includes(avatar.id);

              return (
                <div key={avatar.id} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isLocked) {
                        try {
                          await avatarService.setActiveAvatar(avatar.id);
                          setAvatarKey(avatar.id);
                          setAvatarPickerOpen(false);
                          toast.success("Cập nhật ảnh đại diện thành công");
                        } catch (err) {
                          console.error("Failed to set avatar:", err);
                          toast.error("Cần 7 ngày streak để dùng avatar này!");
                        }
                      }
                    }}
                    disabled={isLocked}
                    title={isLocked ? "Cần 7 ngày streak liên tiếp để mở khóa" : avatar.id}
                    className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200
                      ${isSelected ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border"}
                      ${isLocked ? "opacity-40 cursor-not-allowed" : "hover:scale-110 hover:border-primary/60"}
                      ${isNewlyUnlocked ? "ring-4 ring-yellow-400 ring-offset-2 animate-pulse" : ""}
                    `}
                  >
                    <img src={avatar.src} alt={avatar.id} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock size={14} className="text-white" />
                      </div>
                    )}
                    {isNewlyUnlocked && !isLocked && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        ✨
                      </div>
                    )}
                  </button>
                  {isLocked && (
                    <p className="text-[10px] text-muted-foreground text-center leading-tight">
                      🔥 7 ngày
                    </p>
                  )}
                  {!isLocked && isNewlyUnlocked && (
                    <p className="text-[10px] text-yellow-500 font-bold text-center">Mới!</p>
                  )}
                </div>
              );
            })}
          </div>

        </DialogContent>

      </Dialog>

    </div>
  );
};

/* ──────────────── OVERVIEW TAB ──────────────── */
const formatStudyTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const getStreakDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayName = daysOfWeek[date.getDay()];
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dayName}, ${dd}/${mm}`;
};

const getDayOfMonth = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return String(date.getDate());
};

interface OverviewTabProps {
  currentStreak: number;
  weeklyData: WeeklyItem[];
  streakDays: StreakDayItem[];
  recentScores: ScoreItem[];
  skillColors: Record<string, string>;
  skillIcons: Record<string, React.ReactNode>;
  settingsName: string;
  userPlan: string;
  weekStudySeconds: number;
  completedCount: number;
  skillProgress: SkillProgressResponse | undefined;
}

const OverviewTab = ({
  currentStreak,
  weeklyData, streakDays, recentScores, skillColors, skillIcons,
  settingsName, userPlan, weekStudySeconds,
  completedCount, skillProgress,
}: OverviewTabProps) => {
  const isPremium = userPlan.toLowerCase() !== "miễn phí" && userPlan.toLowerCase() !== "free";

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Xin chào, {settingsName} 👋</h1>
        <p className="text-muted-foreground mt-1">Tiếp tục hành trình chinh phục VSTEP của bạn</p>
      </motion.div>

      {/* Compact Current Plan Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className={`rounded-xl border px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isPremium 
            ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50" 
            : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            isPremium ? "bg-emerald-500 text-white animate-pulse" : "bg-amber-500 text-white"
          }`}>
            <Crown size={16} />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gói hiện tại:</span>
            <span className={`text-sm font-bold truncate ${isPremium ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
              {userPlan}
            </span>
            <span className="text-xs text-muted-foreground hidden md:inline">
              • {isPremium ? "Bạn đang sử dụng các tính năng Premium cao cấp" : "Nâng cấp Premium để mở khóa toàn bộ đề thi & bài học"}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-end">
          {!isPremium ? (
            <Button asChild size="sm" className="h-8 gradient-primary text-primary-foreground font-medium text-xs px-3 shadow-sm">
              <Link to="/#pricing">Nâng cấp ngay</Link>
            </Button>
          ) : (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50/80 dark:bg-emerald-950/45 px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Đang hoạt động
            </span>
          )}
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([
          { icon: <Clock size={20} />, label: "Giờ học tuần này", value: formatStudyTime(weekStudySeconds), color: "text-primary" },
          { icon: <BookOpen size={20} />, label: "Bài đã hoàn thành", value: `${completedCount}`, color: "text-emerald-500" },
          { icon: <Flame size={20} />, label: "Chuỗi ngày học", value: `${currentStreak} ngày`, color: "text-orange-500", isStreak: true },
        ] as { icon: React.ReactNode; label: string; value: string; color: string; isStreak?: boolean }[]).map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}>
            <Card className="border-border card-press cursor-default group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-4 lg:p-5">
                <div className={`${s.color} mb-2 flex items-center gap-2`}>
                  {s.isStreak ? <span className="animate-fire">{s.icon}</span> : s.icon}
                </div>
                <div className="relative">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Streak */}
      <div className="grid gap-6">
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
                {streakDays.map((item: StreakDayItem, i: number) => {
                  const dayLabel = getStreakDayLabel(item.date);
                  const dayNum = getDayOfMonth(item.date);
                  return (
                    <motion.div
                      key={item.date || i}
                      title={dayLabel}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-help ${
                        item.hasActivity ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                    >
                      {item.hasActivity ? "🔥" : dayNum}
                    </motion.div>
                  );
                })}
              </div>
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
              { skill: "Listening" },
              { skill: "Reading" },
              { skill: "Writing" },
              { skill: "Speaking" },
            ].map((s) => {
              const skillKey = s.skill.toLowerCase() as keyof SkillProgressResponse;
              const progressItem = skillProgress ? skillProgress[skillKey] : null;
              const progressVal = progressItem && progressItem.averageScoreOnTen !== null && progressItem.averageScoreOnTen !== undefined
                ? Number(progressItem.averageScoreOnTen) * 10
                : 0;
              const progressLabel = progressItem && progressItem.averageScoreOnTen !== null && progressItem.averageScoreOnTen !== undefined
                ? `${Number(progressItem.averageScoreOnTen).toFixed(1)}/10 (${progressItem.completedCount} bài)`
                : "Chưa có dữ liệu";

              return (
                <div key={s.skill} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${skillColors[s.skill]}`} />
                      <span className="font-medium text-foreground">{s.skill}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{progressLabel}</span>
                  </div>
                  <Progress value={progressVal} className="h-2" />
                </div>
              );
            })}
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
              <Button size="sm" variant="outline" className="mt-1" asChild>
                <Link to="/quiz">Bắt đầu luyện tập ngay</Link>
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
};



/* ──────────────── SETTINGS TAB ──────────────── */
interface SettingsTabProps {
  settingsName: string;
  setSettingsName: (name: string) => void;
  settingsEmail: string;
  avatarKey: string;
  onOpenAvatarPicker: () => void;
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
  settingsName, setSettingsName, settingsEmail,
  avatarKey, onOpenAvatarPicker, handleSaveProfile,
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
                  <AvatarImage src={getAvatarSrc(avatarKey)} alt="Avatar" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {settingsName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={onOpenAvatarPicker}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                >
                  <Camera size={20} />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Ảnh đại diện</p>
                <p className="text-xs text-muted-foreground">Nhấn vào ảnh để chọn ảnh mặc định</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input id="name" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1 text-muted-foreground">
                <Mail size={14} /> Email (Không thể thay đổi)
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={settingsEmail}
                  readOnly
                  disabled
                  className="bg-muted/50 border-muted text-muted-foreground pr-10 cursor-not-allowed"
                />
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              </div>
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
