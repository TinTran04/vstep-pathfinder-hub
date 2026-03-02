import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart3, BookOpen, Clock, Target, TrendingUp, Award, ChevronRight,
  Headphones, BookOpenCheck, Pen, Mic, LogOut, Home, FileText, Settings, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const maxHours = Math.max(...weeklyData.map((d) => d.hours));

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
            { icon: <Target size={20} />, label: "Mục tiêu", href: "#" },
            { icon: <Settings size={20} />, label: "Cài đặt", href: "#" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
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
            <button onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
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
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Xin chào, Nguyễn Văn A 👋</h1>
            <p className="text-muted-foreground mt-1">Tiếp tục hành trình chinh phục VSTEP của bạn</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Clock size={20} />, label: "Giờ học tuần này", value: "12.5h", color: "text-primary" },
              { icon: <BookOpen size={20} />, label: "Bài đã hoàn thành", value: "24/60", color: "text-emerald-500" },
              { icon: <Target size={20} />, label: "Điểm trung bình", value: "7.3", color: "text-amber-500" },
              { icon: <Award size={20} />, label: "Chuỗi ngày học", value: "12 ngày", color: "text-purple-500" },
            ].map((s) => (
              <Card key={s.label} className="border-border">
                <CardContent className="p-4 lg:p-5">
                  <div className={`${s.color} mb-2`}>{s.icon}</div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

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
                  {weeklyData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{d.hours}h</span>
                      <div className="w-full bg-muted rounded-t-lg overflow-hidden" style={{ height: "100%" }}>
                        <div
                          className="w-full gradient-primary rounded-t-lg transition-all duration-500"
                          style={{ height: `${(d.hours / maxHours) * 100}%`, marginTop: "auto" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{d.day}</span>
                    </div>
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
                  <div key={i} className="flex items-center gap-4 py-3">
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
                  </div>
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
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer">
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
    </div>
  );
};

export default Dashboard;
