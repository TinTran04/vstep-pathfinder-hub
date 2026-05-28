// src/features/attempts/pages/AttemptResult.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Trophy, Headphones, BookOpen, Pen, Mic, ArrowRight, BookOpenCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { attemptsService } from "../services/attempts.service";
import type { MockTestAttempt, Skill } from "../types";
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

export const AttemptResult = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<MockTestAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) {
      navigate("/quiz");
      return;
    }
    attemptsService.getAttemptById(attemptId).then((a) => {
      setAttempt(a);
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
          <Button className="gradient-primary text-primary-foreground w-full" onClick={() => navigate("/quiz")}>
            Quay lại luyện đề
          </Button>
        </Card>
      </div>
    );
  }

  const { overallScore, level, mode, skills, strengths = [], weaknesses = [], recommendedPractice = [] } = attempt;
  const levelInfo = LEVEL_DESCRIPTIONS[level || "A2"] || LEVEL_DESCRIPTIONS["A2"];
  const isPractice = mode === "practice";

  // Calculate scores for rendering
  const getSkillDisplayScore = (skillName: Skill) => {
    const skill = skills[skillName];
    if (!skill) return null;

    if (skill.score !== undefined && skill.totalQuestions !== undefined && skill.totalQuestions > 0) {
      const tenPointScale = (skill.score / skill.totalQuestions) * 10;
      return {
        scoreVal: tenPointScale,
        label: `${skill.score}/${skill.totalQuestions} câu`,
        details: `${tenPointScale.toFixed(1)}/10.0`
      };
    }

    if (skillName === "writing") {
      const feedback = skill.writingFeedback;
      if (feedback && Object.keys(feedback).length > 0) {
        const scores = Object.values(feedback).map((f) => {
          const match = f.score.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : 7.0;
        });
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          scoreVal: average,
          label: "Đã chấm điểm",
          details: `${average.toFixed(1)}/10.0`
        };
      }
    }

    if (skillName === "speaking") {
      const feedback = skill.speakingFeedback;
      if (feedback && Object.keys(feedback).length > 0) {
        const scores = Object.values(feedback).map((f) => {
          const match = f.pronunciation.match(/^([\d.]+)/);
          return match ? parseFloat(match[0]) : 7.0;
        });
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          scoreVal: average,
          label: "Đã chấm điểm",
          details: `${average.toFixed(1)}/10.0`
        };
      }
    }

    // Default fallback if score exists directly as a number
    if (skill.score !== undefined) {
      return {
        scoreVal: skill.score,
        label: "Đã hoàn thành",
        details: `${skill.score.toFixed(1)}/10.0`
      };
    }

    return {
      scoreVal: 0,
      label: "Đã hoàn thành",
      details: "Đang xử lý"
    };
  };

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
            <Button variant="ghost" size="sm" onClick={() => navigate("/quiz")} className="text-muted-foreground hover:text-foreground">
              Về trang luyện thi
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
            Ngày hoàn thành: {attempt.finishedAt ? new Date(attempt.finishedAt).toLocaleString("vi-VN") : "N/A"}
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
                  {overallScore !== undefined ? overallScore.toFixed(1) : "0.0"}
                </span>
                <span className="text-lg text-muted-foreground font-bold">/ 10</span>
              </div>

              {/* Band level badge */}
              <div className={`mt-6 px-4 py-1.5 rounded-full border ${levelInfo.color} ${levelInfo.bg} ${levelInfo.border} text-sm font-extrabold flex items-center gap-1.5`}>
                <CheckCircle2 size={16} />
                <span>Bậc VSTEP: {levelInfo.badge}</span>
              </div>
            </CardContent>
          </Card>

          {/* Level description & text */}
          <Card className="md:col-span-7 border-border bg-card flex flex-col justify-between shadow-lg">
            <CardContent className="p-8 space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpenCheck className="text-primary" size={20} />
                <span>Phân tích cấp độ bậc {level || "A2"}</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {levelInfo.desc}
              </p>
              <div className="bg-muted/40 p-4 rounded-xl space-y-2 border border-border/50">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider block">Yêu cầu đạt chuẩn</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Để tăng bậc lên cấp tiếp theo, bạn cần tiếp tục luyện tập đồng đều cả 4 kỹ năng và đặc biệt chú ý khắc phục các kỹ năng yếu có điểm số dưới 6.0.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Scores cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-foreground">Điểm số theo kỹ năng</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {skillConfig.map((skill) => {
              const scoreObj = getSkillDisplayScore(skill.key);
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

        {/* Strengths & Weaknesses analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="border-border bg-card shadow-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>Điểm mạnh (Strengths)</span>
              </h3>
              <ul className="space-y-2.5">
                {strengths.map((str, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card className="border-border bg-card shadow-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Trophy size={18} className="rotate-180" />
                <span>Điểm cần cải thiện (Weaknesses)</span>
              </h3>
              <ul className="space-y-2.5">
                {weaknesses.map((weak, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Practice */}
        <Card className="border-border bg-gradient-to-r from-card to-muted/20 shadow-md">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <ArrowRight size={18} />
              <span>Gợi ý lộ trình luyện tập tiếp theo</span>
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {recommendedPractice.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-background/50 border border-border p-3.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            className="gradient-primary text-primary-foreground px-8 py-6 rounded-xl font-bold flex items-center gap-2 shadow-lg w-full sm:w-auto"
            onClick={() => navigate(`/attempts/${attempt.id}/review`)}
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
