// src/features/attempts/pages/AttemptResult.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Trophy, Headphones, BookOpen, Pen, Mic, BookOpenCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { attemptReviewApiService } from "../services/attempt-review.api-service";
import type { AttemptReviewResponse, Skill } from "../types";
import logoImg from "@/assets/logo.png";

const LEVEL_DESCRIPTIONS: Record<string, { badge: string; desc: string; color: string; bg: string; border: string }> = {
  C1: { badge: "C1 – Thành thạo", desc: "Bạn có khả năng sử dụng tiếng Anh linh hoạt, hiểu được các văn bản dài và giao tiếp tự nhiên trôi chảy.", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900" },
  B2: { badge: "B2 – Trung cấp cao", desc: "Bạn có thể hiểu các ý chính của văn bản phức tạp, giao tiếp tự tin và viết các văn bản rõ ràng, chi tiết.", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900" },
  B1: { badge: "B1 – Trung cấp thấp", desc: "Bạn có thể hiểu các điểm chính của các chủ đề quen thuộc, đối phó với hầu hết các tình huống khi đi du lịch.", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900" },
  A2: { badge: "A2 – Nền tảng cơ bản", desc: "Bạn có thể hiểu các câu và cấu trúc thông dụng, giao tiếp trong các tình huống đơn giản hàng ngày.", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900" },
};

const skillConfig = [
  { key: "listening" as const, label: "Listening", icon: Headphones, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { key: "reading" as const, label: "Reading", icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { key: "writing" as const, label: "Writing", icon: Pen, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { key: "speaking" as const, label: "Speaking", icon: Mic, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
];

type SkillDisplayScore = {
  scoreVal: number;
  label: string;
  details: string;
  isPending?: boolean;
};

export const AttemptResult = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AttemptReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const backLabel = "Dashboard";
  const backPath = "/dashboard";

  useEffect(() => {
    if (!attemptId) {
      navigate("/quiz");
      return;
    }
    attemptReviewApiService.getAttemptReview(attemptId).then((a) => {
      setAttempt(a);
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, [attemptId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Đang tải kết quả bài làm...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border text-center p-8 space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={32} className="opacity-80" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Không tìm thấy kết quả bài làm</h2>
            <p className="text-sm text-muted-foreground">Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ luyện thi.</p>
          </div>
          <Button className="gradient-primary text-primary-foreground w-full" onClick={() => navigate(backPath)}>
            {backLabel}
          </Button>
        </Card>
      </div>
    );
  }

  const isPractice = attempt.skillType && attempt.skillType !== "mock_test";

  // Calculate scores for rendering based on AttemptReviewResponse
  const getSkillDisplayScore = (skillName: Skill): SkillDisplayScore | null => {
    if (skillName === "listening") {
      const listeningSections = attempt.sections.filter(s => s.skillType === "listening" || (!s.skillType && s.audioUrl));
      if (listeningSections.length === 0) return null;
      let totalQuestions = 0;
      let correct = 0;
      listeningSections.forEach(s => {
        s.questions.forEach(q => {
          totalQuestions++;
          if (q.isCorrectAnswer) correct++;
        });
      });
      const tenPointScale = totalQuestions > 0 ? (correct / totalQuestions) * 10 : 0;
      return {
        scoreVal: tenPointScale,
        label: `${correct}/${totalQuestions} câu`,
        details: `${tenPointScale.toFixed(1)}/10.0`
      };
    }

    if (skillName === "reading") {
      const readingSections = attempt.sections.filter(s => s.skillType === "reading" || (!s.skillType && s.passageText && !s.audioUrl));
      if (readingSections.length === 0) return null;
      let totalQuestions = 0;
      let correct = 0;
      readingSections.forEach(s => {
        s.questions.forEach(q => {
          totalQuestions++;
          if (q.isCorrectAnswer) correct++;
        });
      });
      const tenPointScale = totalQuestions > 0 ? (correct / totalQuestions) * 10 : 0;
      return {
        scoreVal: tenPointScale,
        label: `${correct}/${totalQuestions} câu`,
        details: `${tenPointScale.toFixed(1)}/10.0`
      };
    }

    if (skillName === "writing") {
      const feedback = attempt.writingReview;
      if (feedback) {
        if (feedback.score !== null && feedback.score !== undefined) {
           return {
             scoreVal: Number(feedback.score),
             label: "Đã chấm điểm",
             details: `${Number(feedback.score).toFixed(1)}/10.0`
           };
        }
        if (feedback.status === "scored" || feedback.status === "failed") {
            const rawScore = feedback.score || 0;
            return {
              scoreVal: Number(rawScore),
              label: feedback.status === "failed" ? "Lỗi chấm điểm" : "Đã chấm điểm",
              details: `${Number(rawScore).toFixed(1)}/10.0`
            };
        }
        return {
          scoreVal: 0,
          label: "Đang chấm...",
          details: "Chờ AI xử lý",
          isPending: true
        };
      }
      return null;
    }

    if (skillName === "speaking") {
      const feedback = attempt.speakingReview;
      if (feedback) {
        if (feedback.score !== null && feedback.score !== undefined) {
           return {
             scoreVal: Number(feedback.score),
             label: "Đã chấm điểm",
             details: `${Number(feedback.score).toFixed(1)}/10.0`
           };
        }
        if (feedback.status === "scored" || feedback.status === "failed") {
            const rawScore = feedback.score || 0;
            return {
              scoreVal: Number(rawScore),
              label: feedback.status === "failed" ? "Lỗi chấm điểm" : "Đã chấm điểm",
              details: `${Number(rawScore).toFixed(1)}/10.0`
            };
        }
        return {
          scoreVal: 0,
          label: "Đang chấm...",
          details: "Chờ AI xử lý",
          isPending: true
        };
      }
      if (!isPractice) {
        return {
          scoreVal: 0,
          label: "Không nộp bài",
          details: "0.0/10.0"
        };
      }
      return null;
    }

    return null;
  };

  const skillScores: Record<Skill, SkillDisplayScore | null> = {
    listening: getSkillDisplayScore("listening"),
    reading: getSkillDisplayScore("reading"),
    writing: getSkillDisplayScore("writing"),
    speaking: getSkillDisplayScore("speaking"),
  };

  const hasPendingAiScore = Boolean(skillScores.writing?.isPending || skillScores.speaking?.isPending);

  const calculateOverallScore = () => {
     if (hasPendingAiScore) return null;

     const listening = skillScores.listening?.scoreVal ?? 0;
     const reading = skillScores.reading?.scoreVal ?? 0;
     const writing = skillScores.writing?.scoreVal ?? 0;
     const speaking = skillScores.speaking?.scoreVal ?? 0;
     return (listening + reading + writing + speaking) / 4;
  };

  const overallScore = calculateOverallScore();
  
  // Calculate level based on overallScore
  let level = "A2";
  if (overallScore !== null && overallScore >= 8.5) level = "C1";
  else if (overallScore !== null && overallScore >= 6.0) level = "B2";
  else if (overallScore !== null && overallScore >= 4.0) level = "B1";

  const levelInfo = LEVEL_DESCRIPTIONS[level] || LEVEL_DESCRIPTIONS["A2"];
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="VstepUp" className="w-7 h-7 rounded-lg object-contain" />
            </Link>
            <span className="font-bold text-foreground text-sm">Kết quả bài làm</span>
            <Badge className="gradient-primary text-primary-foreground text-xs font-semibold">
              {isPractice ? "Luyện tập" : "Thi thử Full Test"}
            </Badge>
          </div>
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} className="text-muted-foreground hover:text-foreground">
              {backLabel}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        {/* Title */}
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold tracking-wider uppercase text-primary">Hoàn thành bài kiểm tra</p>
          <h1 className="text-3xl font-extrabold text-foreground">
            Báo cáo kết quả chi tiết
          </h1>
          <p className="text-sm text-muted-foreground">
            Ngày hoàn thành: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString("vi-VN") : "N/A"}
          </p>
        </div>

        {/* Overall score section */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Overall Card */}
          <Card className="md:col-span-5 border-border bg-gradient-to-br from-card to-background overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[280px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Trophy size={32} className="animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Điểm số trung bình</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-6xl font-black text-foreground">
                  {overallScore === null ? "Chờ AI" : overallScore.toFixed(1)}
                </span>
                {overallScore !== null && <span className="text-lg text-muted-foreground font-bold">/ 10</span>}
              </div>

              {/* Band level badge */}
              {overallScore === null ? (
                <div className="mt-6 px-4 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400 text-sm font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>Đang chờ chấm AI</span>
                </div>
              ) : (
                <div className={`mt-6 px-4 py-1.5 rounded-full border ${levelInfo.color} ${levelInfo.bg} ${levelInfo.border} text-sm font-extrabold flex items-center gap-1.5`}>
                  <CheckCircle2 size={16} />
                  <span>Bậc VSTEP: {levelInfo.badge}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Level description & text */}
          <Card className="md:col-span-7 border-border bg-card flex flex-col justify-between shadow-lg">
            <CardContent className="p-8 space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpenCheck className="text-primary" size={20} />
                <span>{overallScore === null ? "Đang chờ hoàn tất chấm AI" : `Phân tích cấp độ bậc ${level || "A2"}`}</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {overallScore === null ? "Kết quả tổng hợp sẽ hiển thị sau khi Writing và Speaking được chấm xong." : levelInfo.desc}
              </p>
              {overallScore !== null && (
                <div className="bg-muted/40 p-4 rounded-xl space-y-2 border border-border/50">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider block">Yêu cầu đạt chuẩn</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Để tăng bậc lên cấp tiếp theo, bạn cần tiếp tục luyện tập đồng đều cả 4 kỹ năng và đặc biệt chú ý khắc phục các kỹ năng yếu có điểm số dưới 6.0.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skill Scores cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-foreground">Điểm số theo kỹ năng</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {skillConfig.map((skill) => {
              const scoreObj = skillScores[skill.key];
              const Icon = skill.icon;
              
              if (!scoreObj) {
                return (
                  <Card key={skill.key} className="border-border opacity-50 bg-muted/20">
                    <CardContent className="p-5 flex flex-col justify-between h-36">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{skill.label}</span>
                        <Icon size={20} className="text-muted-foreground/50" />
                      </div>
                      <div className="text-center py-2">
                        <span className="text-xs text-muted-foreground font-medium">Chưa có dữ liệu</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted-foreground/10 rounded-full" />
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={skill.key} className="border-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow bg-card">
                  <CardContent className="p-5 flex flex-col justify-between h-36">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">{skill.label}</span>
                      <div className={`p-1.5 rounded-lg ${skill.bg} ${skill.color}`}>
                        <Icon size={16} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-foreground">
                        {scoreObj.details}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {scoreObj.label}
                      </p>
                    </div>
                    <Progress value={(scoreObj.scoreVal / 10) * 100} className="h-1.5" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            className="gradient-primary text-primary-foreground px-8 py-6 rounded-xl font-bold flex items-center gap-2 shadow-lg w-full sm:w-auto"
            onClick={() => navigate(`/attempts/${attempt.attemptId}/review?from=history`)}
          >
            <span>Xem lại bài làm chi tiết</span>
            <ChevronRight size={16} />
          </Button>
          <Button 
            variant="outline" 
            className="px-8 py-6 rounded-xl font-semibold border-border hover:bg-muted w-full sm:w-auto"
            onClick={() => navigate("/quiz")}
          >
            Luyện đề tiếp
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AttemptResult;
