import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Shield, Clock, Headphones, BookOpen, Pen, Mic, AlertTriangle, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect } from "react";
import logoImg from "@/assets/logo.png";
import { attemptsService } from "../services/attempts.service";

const skills = [
  {
    icon: <Headphones size={20} />,
    label: "Listening",
    time: "~40 phút",
    questions: "35 câu",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: <BookOpen size={20} />,
    label: "Reading",
    time: "~60 phút",
    questions: "40 câu",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: <Pen size={20} />,
    label: "Writing",
    time: "~60 phút",
    questions: "2 tasks",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: <Mic size={20} />,
    label: "Speaking",
    time: "~15 phút",
    questions: "3 parts",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const rules = [
  "Bộ đếm giờ chạy liên tục — không thể tạm dừng",
  "Audio Listening không thể tua lại hoặc tua tới",
  "Không xem đáp án trong khi đang thi",
  "Các kỹ năng lần lượt nối tiếp nhau không gián đoạn",
  "Kết quả và đánh giá chi tiết sau khi hoàn thành toàn bộ",
];

const MockTestLanding = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) navigate("/auth");
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn || !user) return null;

  const handleStart = async () => {
    await attemptsService.startMockTest();
    navigate("/quiz/listening/take?mode=mock_test&session=mock");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="VSTEPPro" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-lg text-foreground">
                VSTEP<span className="text-gradient">Pro</span>
              </span>
            </Link>
            <button
              onClick={() => navigate("/quiz")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden sm:inline">{user.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-2">
            <Shield size={16} /> Mock Test — Thi thử VSTEP
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Bài thi thử{" "}
            <span className="text-gradient">Full Test VSTEP</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Trải nghiệm bài thi đầy đủ 4 kỹ năng như kỳ thi VSTEP thật. Thứ tự, thời gian và điều kiện thi đều được mô phỏng chính xác.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Test structure */}
          <Card className="border-border">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Cấu trúc bài thi
              </h2>
              <div className="space-y-3">
                {skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} ${s.color} shrink-0`}>
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{s.label}</span>
                        <Badge variant="outline" className="text-xs">{s.questions}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.time}</p>
                    </div>
                    {i < skills.length - 1 && (
                      <ChevronRight size={16} className="text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Tổng thời gian:{" "}
                  <span className="font-semibold text-foreground">~2 giờ 55 phút</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rules */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" /> Quy định thi thử
              </h2>
              <ul className="space-y-2.5">
                {rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-amber-600 mt-0.5 shrink-0">!</span>
                    {rule}
                  </li>
                ))}
              </ul>
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-700 font-medium">
                  ✓ Sau khi hoàn thành: xem kết quả tổng hợp, đáp án chi tiết, feedback AI Writing & Speaking, và nghe lại bản ghi âm của bạn.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button
            className="gradient-primary text-primary-foreground text-base px-10 py-6 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            onClick={handleStart}
          >
            🚀 Bắt đầu thi thử ngay
          </Button>
          <p className="text-xs text-muted-foreground">
            Bài thi sẽ bắt đầu từ kỹ năng <strong>Listening</strong>. Đảm bảo bạn đã sẵn sàng trước khi bắt đầu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MockTestLanding;
