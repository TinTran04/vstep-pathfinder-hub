import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart3, BookOpen, Clock, Target, TrendingUp, Award, ChevronRight,
  Headphones, BookOpenCheck, Pen, Mic, LogOut, Home, FileText, Settings, User,
  Flame, Gift, Share2, Star, Zap, Trophy, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

const lessons = [
  { id: 1, title: "Nghe hiểu hội thoại ngắn", skill: "Listening", duration: "15 phút", progress: 100 },
  { id: 2, title: "Đọc hiểu đoạn văn học thuật", skill: "Reading", duration: "20 phút", progress: 75 },
  { id: 3, title: "Viết email & thư trang trọng", skill: "Writing", duration: "25 phút", progress: 40 },
  { id: 4, title: "Mô tả biểu đồ & bảng số liệu", skill: "Writing", duration: "30 phút", progress: 0 },
  { id: 5, title: "Phỏng vấn cá nhân", skill: "Speaking", duration: "15 phút", progress: 60 },
  { id: 6, title: "Nghe hiểu bài giảng dài", skill: "Listening", duration: "20 phút", progress: 0 },
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

// Streak data
const streakDays = [true, true, true, true, true, true, true, true, true, true, true, true, false, false];
const currentStreak = 12;

// Reward point actions
const pointActions = [
  { action: "Hoàn thành 1 bài học", points: 10, icon: BookOpen },
  { action: "Hoàn thành 1 đề thi", points: 25, icon: FileText },
  { action: "Đạt điểm ≥ 7.0", points: 15, icon: Star },
  { action: "Duy trì streak 7 ngày", points: 50, icon: Flame },
  { action: "Chia sẻ website", points: 30, icon: Share2 },
  { action: "Mời bạn bè đăng ký", points: 100, icon: Gift },
];

const rewardMilestones = [
  { points: 100, reward: "Mở khóa 1 đề thi Premium", unlocked: true },
  { points: 300, reward: "Badge 'Học viên chăm chỉ'", unlocked: true },
  { points: 500, reward: "Giảm 10% gói Tháng", unlocked: false },
  { points: 1000, reward: "1 tuần Premium miễn phí", unlocked: false },
  { points: 2000, reward: "Chấm Writing AI không giới hạn", unlocked: false },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const maxHours = Math.max(...weeklyData.map((d) => d.hours));
  const [shareDialog, setShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalPoints, setTotalPoints] = useState(350);
  const [showPointAnim, setShowPointAnim] = useState(false);
  const [pointDelta, setPointDelta] = useState(0);

  const shareUrl = "https://vstep-pathfinder-hub.lovable.app";

  const handleShare = (platform: string) => {
    const text = "Mình đang luyện thi VSTEP trên VSTEPPro, nền tảng rất hay! Thử ngay: ";
    if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "zalo") {
      window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`, "_blank");
    }
    // Award points
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
          {[
            { icon: <BarChart3 size={20} />, label: "Dashboard", href: "/dashboard", active: true },
            { icon: <BookOpen size={20} />, label: "Bài học", href: "/quiz" },
            { icon: <FileText size={20} />, label: "Luyện đề", href: "/quiz" },
            { icon: <Trophy size={20} />, label: "Điểm thưởng", href: "#rewards" },
            { icon: <Target size={20} />, label: "Mục tiêu", href: "#" },
            { icon: <Settings size={20} />, label: "Cài đặt", href: "#" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-x-0 ${
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Nguyễn Văn A</p>
              <p className="text-xs text-muted-foreground">Gói Nâng cao</p>
            </div>
            <button onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground transition-colors">
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            <LogOut size={18} />
          </Button>
        </div>

        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Xin chào, Nguyễn Văn A 👋</h1>
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
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              >
                <Card className="border-border card-press cursor-default group hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-4 lg:p-5">
                    <div className={`${s.color} mb-2 flex items-center gap-2`}>
                      {(s as any).isStreak ? (
                        <span className="animate-fire">{s.icon}</span>
                      ) : s.icon}
                    </div>
                    <div className="relative">
                      <p className="text-2xl font-bold text-foreground">
                        {s.value}
                      </p>
                      {/* Point animation */}
                      <AnimatePresence>
                        {(s as any).isPoints && showPointAnim && (
                          <motion.span
                            className="absolute -top-4 right-0 text-sm font-bold text-amber-500"
                            initial={{ opacity: 1, y: 0 }}
                            animate={{ opacity: 0, y: -20 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                          >
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

          {/* Streak Calendar + Rewards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Streak Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame size={20} className="text-orange-500 animate-fire" />
                    Chuỗi ngày học liên tiếp
                    <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200 text-xs">
                      🔥 {currentStreak} ngày
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                      <span key={d} className="text-xs text-muted-foreground text-center font-medium">{d}</span>
                    ))}
                    {streakDays.map((active, i) => (
                      <motion.div
                        key={i}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                          active
                            ? "bg-orange-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                      >
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

            {/* Reward Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              id="rewards"
            >
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy size={20} className="text-amber-500" />
                      Điểm thưởng
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Zap size={16} className="text-amber-500" />
                      <span className="text-lg font-bold text-foreground">{totalPoints}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Cách kiếm điểm */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cách kiếm điểm</p>
                    {pointActions.slice(0, 4).map((pa) => (
                      <div key={pa.action} className="flex items-center gap-3 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <pa.icon size={14} className="text-primary" />
                        </div>
                        <span className="flex-1 text-muted-foreground">{pa.action}</span>
                        <Badge variant="secondary" className="text-xs font-bold text-amber-600">+{pa.points}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Share CTA */}
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5 gap-2"
                    onClick={() => setShareDialog(true)}
                  >
                    <Share2 size={16} />
                    Chia sẻ & nhận 30 điểm
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Reward Milestones Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift size={20} className="text-primary" />
                  Phần thưởng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {rewardMilestones.map((m, i) => (
                    <div
                      key={m.points}
                      className={`flex-shrink-0 w-40 p-3 rounded-xl border text-center transition-all ${
                        m.unlocked
                          ? "bg-primary/5 border-primary/30"
                          : totalPoints >= m.points * 0.7
                          ? "bg-amber-50 border-amber-200"
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                        {m.unlocked ? (
                          <Check size={16} className="text-primary" />
                        ) : (
                          <Zap size={16} className="text-amber-500" />
                        )}
                        {m.points}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.reward}</p>
                      {m.unlocked && (
                        <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 text-[10px]">Đã mở</Badge>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{totalPoints} điểm</span>
                    <span>Tiếp theo: 500 điểm</span>
                  </div>
                  <Progress value={(totalPoints / 500) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Weekly chart */}
            <Card className="lg:col-span-2 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" />
                  Thời gian học trong tuần
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-40 mt-4">
                  {weeklyData.map((d, i) => (
                    <motion.div
                      key={d.day}
                      className="flex-1 flex flex-col items-center gap-2"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
                      style={{ transformOrigin: "bottom" }}
                    >
                      <span className="text-xs font-medium text-muted-foreground">{d.hours}h</span>
                      <div className="w-full bg-muted rounded-t-lg overflow-hidden" style={{ height: "100%" }}>
                        <div
                          className="w-full gradient-primary rounded-t-lg transition-all duration-500"
                          style={{ height: `${(d.hours / maxHours) * 100}%`, marginTop: "auto" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{d.day}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill progress */}
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
                <Button variant="ghost" size="sm" className="text-primary">
                  Xem tất cả <ChevronRight size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {recentScores.map((r, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-4 py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                  >
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

          {/* Lesson list */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Bài học tiếp theo</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/quiz")}>
                  Xem tất cả <ChevronRight size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {lessons.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 cursor-pointer card-press">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      l.progress === 100
                        ? "bg-emerald-100 text-emerald-600"
                        : l.progress > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {skillIcons[l.skill]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{l.skill}</span>
                        <span>·</span>
                        <span>{l.duration}</span>
                        <span>·</span>
                        <span className="text-amber-600 font-medium">+10 điểm</span>
                      </div>
                    </div>
                    {l.progress === 100 ? (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Hoàn thành</span>
                    ) : l.progress > 0 ? (
                      <span className="text-xs font-medium text-primary">{l.progress}%</span>
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleShare("copy")}
                className="shrink-0"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleShare("facebook")}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-600"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleShare("zalo")}
              >
                <span className="w-4 h-4 rounded bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">Z</span>
                Zalo
              </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-sm font-medium text-amber-800">
                💰 Mời bạn bè đăng ký → <strong>+100 điểm/người</strong>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
