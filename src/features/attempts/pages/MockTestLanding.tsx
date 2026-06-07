import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Shield, Clock, Headphones, BookOpen, Pen, Mic, AlertTriangle, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarSrc } from "@/features/auth/avatarCatalog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect, useState } from "react";
import logoImg from "@/assets/logo.png";
import { attemptsService } from "../services/attempts.service";
import { examService } from "@/features/quiz/services/exam.service";
import { toast } from "sonner";

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
  const { isLoggedIn, isInitialising, user, logout } = useAuth();

  const [mockTests, setMockTests] = useState<{ groupId: string; groupTitle: string; difficulty: string; listeningExamId: string }[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  useEffect(() => {
    if (isInitialising) return;

    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }

    let active = true;
    examService.getExamsBySkill("listening")
      .then((exams) => {
        if (!active) return;
        const groupsMap: Record<string, { groupId: string; groupTitle: string; difficulty: string; listeningExamId: string }> = {};
        exams.forEach(e => {
          if (e.description?.includes("mode:mock_test")) {
            const groupMatch = e.description.match(/group:([^;|\n]+)/);
            const titleMatch = e.description.match(/groupTitle:([^;|\n]+)/);
            const groupId = groupMatch ? groupMatch[1] : "";
            const groupTitle = titleMatch ? titleMatch[1] : e.title.replace(/\s*-\s*Listening$/i, "");
            if (groupId) {
              groupsMap[groupId] = {
                groupId,
                groupTitle,
                difficulty: "Trung bình",
                listeningExamId: e.id,
              };
            }
          }
        });
        const list = Object.values(groupsMap);
        setMockTests(list);
        if (list.length > 0) {
          setSelectedGroupId(list[0].groupId);
        }
        setLoadingExams(false);
      })
      .catch((err) => {
        console.error(err);
        if (active) setLoadingExams(false);
      });
    return () => { active = false; };
  }, [isInitialising, isLoggedIn, navigate]);

  if (!isLoggedIn || !user) return null;

  const handleStart = async () => {
    const selected = mockTests.find(m => m.groupId === selectedGroupId);
    if (!selected) {
      toast.error("Vui lòng chọn một đề thi thử!");
      return;
    }
    await attemptsService.startMockTest();
    navigate(`/quiz/listening/take?mode=mock_test&session=mock&examId=${selected.listeningExamId}&groupId=${selected.groupId}`);
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
              <AvatarImage src={getAvatarSrc(user.avatarKey)} alt={user.name} />
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

        {/* Mock Test Selection */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
              🏆 Chọn đề thi thử VSTEP
            </h2>
            {loadingExams ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">Đang tải danh sách đề thi thử...</span>
              </div>
            ) : mockTests.length === 0 ? (
              <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 p-4 rounded-xl text-sm">
                ⚠️ Hiện tại chưa có đề thi thử 4 kỹ năng nào được đăng tải trên hệ thống. Vui lòng quay lại sau!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mockTests.map((t) => (
                  <button
                    key={t.groupId}
                    onClick={() => setSelectedGroupId(t.groupId)}
                    className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col gap-1.5 ${
                      selectedGroupId === t.groupId
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-sm text-foreground">{t.groupTitle}</span>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none text-[10px]">
                        Full Test 🏆
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>Độ khó: <strong className="text-foreground">{t.difficulty}</strong></span>
                      <span>•</span>
                      <span>4 Kỹ năng</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
            disabled={mockTests.length === 0 || !selectedGroupId}
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
