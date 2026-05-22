import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Headphones, BookOpenCheck, Pen, Mic, ArrowLeft, Clock, FileText, ChevronRight, Star, Info, BookOpen, LogOut, Shield, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import logoImg from "@/assets/logo.png";

import { quizService } from "../services/quiz.service";
import { type Skill, type QuizItem } from "../mocks/quiz.mock";

const skillIcons: Record<Skill, React.ReactNode> = {
  listening: <Headphones size={28} />,
  reading: <BookOpenCheck size={28} />,
  writing: <Pen size={28} />,
  speaking: <Mic size={28} />,
};

type SkillView = "exams" | "overview";

const difficultyColor = (d: string) => {
  if (d === "Dễ") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (d === "Trung bình") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
};

interface SkillItem {
  key: Skill;
  label: string;
  color: string;
  bgColor: string;
  desc: string;
}

interface StructureItem {
  part: string;
  content: string;
  questions: string;
  time: string;
}

interface OverviewData {
  structure: StructureItem[];
  tips: string[];
  scoring: string;
}

const Quiz = () => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillView, setSkillView] = useState<SkillView>("exams");
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();

  const [skillsList, setSkillsList] = useState<SkillItem[]>([]);
  const [quizzesList, setQuizzesList] = useState<Record<Skill, QuizItem[]> | null>(null);
  const [overviewDataState, setOverviewDataState] = useState<Record<Skill, OverviewData> | null>(null);
  const [loading, setLoading] = useState(true);

  const skillRoutes: Record<Skill, string> = {
    listening: "/quiz/listening/take",
    reading: "/quiz/reading/take",
    writing: "/quiz/writing/take",
    speaking: "/quiz/speaking/take",
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/auth");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [s, q, o] = await Promise.all([
          quizService.getQuizSkills(),
          quizService.getQuizList(),
          quizService.getQuizOverview(),
        ]);
        if (active) {
          setSkillsList(s);
          setQuizzesList(q);
          setOverviewDataState(o);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const handleStartQuiz = (q: QuizItem) => {
    setSelectedQuiz(q);
    setConfirmDialog(true);
  };

  const confirmStart = () => {
    if (!selectedSkill) return;
    navigate(`${skillRoutes[selectedSkill]}?mode=practice`);
    setConfirmDialog(false);
  };

  if (!isLoggedIn || !user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải dữ liệu bài thi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="VSTEPPro" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-lg text-foreground">VSTEP<span className="text-gradient">Pro</span></span>
            </Link>
            {selectedSkill && (
              <button onClick={() => { setSelectedSkill(null); setSkillView("exams"); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Chọn kỹ năng
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{user.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        {!selectedSkill ? (
          <div className="space-y-10">
            {/* Mock Test Banner */}
            <Card
              className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate("/mock-test")}
            >
              <CardContent className="p-6 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Shield size={26} className="text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-foreground">Thi thử Full Test VSTEP</h2>
                    <Badge className="gradient-primary text-primary-foreground text-xs">Mock Test</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Bài thi đầy đủ 4 kỹ năng (Listening → Reading → Writing → Speaking) với điều kiện thi thật. Nhận điểm tổng hợp và feedback chi tiết sau khi hoàn thành.
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={12} /> ~2 giờ 55 phút</span>
                    <span className="flex items-center gap-1"><Trophy size={12} /> Điểm tổng hợp 4 kỹ năng</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-primary shrink-0" />
              </CardContent>
            </Card>

            {/* Practice header */}
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Luyện đề từng kỹ năng</h1>
              <p className="text-muted-foreground mt-3">Luyện tập linh hoạt — tạm dừng, tua audio và xem đáp án khi cần</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {skillsList.map((s) => (
                <button key={s.key} onClick={() => setSelectedSkill(s.key)}
                  className={`card-edu text-left p-8 group cursor-pointer border-2 ${s.bgColor} hover:scale-[1.02]`}>
                  <div className={`w-14 h-14 rounded-2xl bg-card flex items-center justify-center ${s.color} mb-4 group-hover:scale-110 transition-transform`}>
                    {skillIcons[s.key]}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    Xem đề thi <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Skill header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${skillsList.find(s => s.key === selectedSkill)!.bgColor} ${skillsList.find(s => s.key === selectedSkill)!.color}`}>
                  {skillIcons[selectedSkill]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{skillsList.find(s => s.key === selectedSkill)!.label}</h1>
                  <p className="text-sm text-muted-foreground">{quizzesList?.[selectedSkill]?.length ?? 0} đề thi có sẵn</p>
                </div>
              </div>

              {/* Overview / Đề thi toggle */}
              <div className="flex gap-2 mt-4">
                <Button variant={skillView === "overview" ? "default" : "outline"} size="sm"
                  onClick={() => setSkillView("overview")} className={skillView === "overview" ? "gradient-primary text-primary-foreground" : ""}>
                  <Info size={16} className="mr-1" /> Overview
                </Button>
                <Button variant={skillView === "exams" ? "default" : "outline"} size="sm"
                  onClick={() => setSkillView("exams")} className={skillView === "exams" ? "gradient-primary text-primary-foreground" : ""}>
                  <FileText size={16} className="mr-1" /> Đề thi
                </Button>
              </div>
            </div>

            {skillView === "overview" ? (
              /* Overview content */
              <div className="space-y-6">
                {/* Structure table */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen size={18} className="text-primary" /> Cấu trúc bài thi
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-semibold text-foreground">Phần</th>
                            <th className="text-left py-2 px-3 font-semibold text-foreground">Nội dung</th>
                            <th className="text-left py-2 px-3 font-semibold text-foreground">Số câu</th>
                            <th className="text-left py-2 px-3 font-semibold text-foreground">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSkill && overviewDataState?.[selectedSkill]?.structure.map((row: StructureItem, i: number) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2.5 px-3 font-medium text-primary">{row.part}</td>
                              <td className="py-2.5 px-3 text-foreground">{row.content}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{row.questions}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{row.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Scoring */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-2">📊 Thang điểm</h3>
                    <p className="text-sm text-muted-foreground">{overviewDataState?.[selectedSkill]?.scoring}</p>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-3">💡 Mẹo làm bài</h3>
                    <ul className="space-y-2">
                      {overviewDataState?.[selectedSkill]?.tips.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary font-bold">•</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Exam list */
              <div className="space-y-3">
                {quizzesList?.[selectedSkill]?.map((q) => (
                  <Card key={q.id} className="border-border hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleStartQuiz(q)}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <FileText size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground">{q.title}</h3>
                          {q.isFree && <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Miễn phí</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{q.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={12} /> {q.duration}</span>
                          <span>{q.questions} câu hỏi</span>
                          <Badge variant="outline" className={`text-xs ${difficultyColor(q.difficulty)}`}>{q.difficulty}</Badge>
                        </div>
                      </div>
                      <Button size="sm" className="gradient-primary text-primary-foreground shrink-0">Làm bài</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bắt đầu làm bài?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 mt-2">
                {selectedQuiz && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <FileText size={18} className="text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{selectedQuiz.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Clock size={12} /> {selectedQuiz.duration}</span>
                        <span>{selectedQuiz.questions} câu hỏi</span>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Bạn đang bắt đầu làm bài ở chế độ **Luyện tập**. Ở chế độ này, bạn có thể tạm dừng thời gian làm bài, tua audio và xem giải thích chi tiết sau khi nộp bài.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Quay lại</Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={confirmStart}
            >
              🚀 Luyện tập ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quiz;
