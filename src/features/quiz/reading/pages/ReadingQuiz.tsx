import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, RotateCcw, BookOpen, PauseCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import { type Question, type Passage } from "../mocks/reading.mock";
import { readingService } from "../services/reading.service";
import { getPermissions, MOCK_TEST_NEXT_ROUTE, MOCK_TEST_NEXT_SKILL_LABEL } from "@/features/attempts/config/modePermissions";
import { attemptsService } from "@/features/attempts/services/attempts.service";
import MockTestTransition from "@/features/attempts/components/MockTestTransition";
import { getReadingExplanation } from "@/features/quiz/mocks/explanations.mock";

import { Badge } from "@/components/ui/badge";

const ReadingQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") ?? "practice";
  const session = searchParams.get("session") ?? "";
  const isMockSession = modeParam === "mock_test" && session === "mock";
  const perms = getPermissions(modeParam);

  const [quizData, setQuizData] = useState<{
    passages: Passage[];
    totalTime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassage, setCurrentPassage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let active = true;
    readingService.getReadingQuiz().then((res) => {
      if (active) {
        setQuizData(res);
        setTimeLeft(res.totalTime);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading || submitted || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 0) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitted, isPaused]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading || !quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải dữ liệu bài thi đọc...</p>
        </div>
      </div>
    );
  }

  const { passages, totalTime } = quizData;
  const allQuestions = passages.flatMap((p) => p.questions);
  const totalQ = allQuestions.length;
  const passage = passages[currentPassage];
  const score = submitted ? allQuestions.filter((q) => answers[q.id] === q.correct).length : 0;

  const reset = () => {
    setAnswers({}); setCurrentPassage(0); setSubmitted(false);
    setTimeLeft(totalTime); setIsPaused(false);
  };

  const handleSubmit = async () => {
    await attemptsService.saveSkillAttempt("reading", {
      answers,
      score,
      totalQuestions: totalQ,
    });
    setSubmitted(true);
  };

  // Mock test: show transition
  if (submitted && isMockSession) {
    return (
      <MockTestTransition
        completedSkillLabel="Reading"
        nextSkillLabel={MOCK_TEST_NEXT_SKILL_LABEL["reading"]}
        nextRoute={`${MOCK_TEST_NEXT_ROUTE["reading"]}?mode=mock_test&session=mock`}
      />
    );
  }

  // Practice: show results
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border">
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${score >= 30 ? "bg-emerald-100" : score >= 20 ? "bg-amber-100" : "bg-red-100"}`}>
              {score >= 30 ? <CheckCircle2 size={40} className="text-emerald-600" /> : <XCircle size={40} className={score >= 20 ? "text-amber-600" : "text-red-600"} />}
            </div>
            <h2 className="text-2xl font-bold text-foreground">Kết quả Reading</h2>
            <div className="text-5xl font-bold text-foreground">{score}<span className="text-2xl text-muted-foreground">/{totalQ}</span></div>
            <p className="text-muted-foreground">{score >= 30 ? "Xuất sắc!" : score >= 20 ? "Khá tốt!" : "Cần cải thiện thêm."}</p>
            
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 my-4 text-left border-t border-b border-border py-4">
              {passages.map((p, pi) => {
                const prevQuestionsCount = passages.slice(0, pi).reduce((s, pt) => s + pt.questions.length, 0);
                return (
                  <div key={pi} className="space-y-3 pt-2 first:pt-0">
                    <h3 className="font-bold text-sm text-foreground">{p.title}</h3>
                    <div className="space-y-3">
                      {p.questions.map((sq, i) => {
                        const globalIdx = prevQuestionsCount + i + 1;
                        const isCorrect = answers[sq.id] === sq.correct;
                        const userAnsStr = answers[sq.id] !== undefined ? sq.options[answers[sq.id]] : "Chưa trả lời";
                        const correctAnsStr = sq.options[sq.correct];
                        const explanation = getReadingExplanation(sq.id);

                        return (
                          <div key={sq.id} className={`p-4 rounded-xl border-2 space-y-2 ${isCorrect ? "bg-emerald-50/50 border-emerald-200" : "bg-red-50/50 border-red-200"}`}>
                            <div className="flex items-start gap-2 justify-between">
                              <h4 className="text-xs font-semibold text-foreground leading-relaxed">
                                Câu {globalIdx}: {sq.question}
                              </h4>
                              <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                                {isCorrect ? "Đúng" : "Sai"}
                              </Badge>
                            </div>
                            <div className="text-xs space-y-1">
                              <p className="text-muted-foreground">
                                Bạn chọn: <span className={`font-semibold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>{userAnsStr}</span>
                              </p>
                              {!isCorrect && (
                                <p className="text-muted-foreground">
                                  Đáp án đúng: <span className="font-semibold text-emerald-700">{correctAnsStr}</span>
                                </p>
                              )}
                              <div className="mt-2 p-2.5 bg-background/50 border border-border rounded-lg">
                                <p className="font-semibold text-xs text-foreground mb-1">💡 Giải thích tiếng Việt:</p>
                                <p className="text-muted-foreground leading-relaxed">{explanation}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quiz")}><ArrowLeft size={16} /> Quay lại</Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={reset}><RotateCcw size={16} /> Làm lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Thoát
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Clock size={16} className={timeLeft < 300 ? "text-destructive" : isPaused ? "text-amber-500" : "text-muted-foreground"} />
              <span className={timeLeft < 300 ? "text-destructive" : isPaused ? "text-amber-500" : "text-foreground"}>
                {formatTime(timeLeft)}
              </span>
              {isPaused && <span className="text-xs text-amber-500 font-medium">(Tạm dừng)</span>}
            </div>
            {perms.canPauseTimer && (
              <Button size="sm" variant={isPaused ? "default" : "outline"}
                onClick={() => setIsPaused((p) => !p)}
                className={`gap-1.5 ${isPaused ? "gradient-primary text-primary-foreground" : ""}`}>
                {isPaused ? <><Play size={14} /> Tiếp tục</> : <><PauseCircle size={14} /> Tạm dừng</>}
              </Button>
            )}
            <span className="text-sm text-muted-foreground">Đã trả lời {Object.keys(answers).length}/{totalQ}</span>
          </div>
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={handleSubmit}>Nộp bài</Button>
        </div>
        <Progress value={(Object.keys(answers).length / totalQ) * 100} className="h-1" />
      </header>

      {/* Pause overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <PauseCircle size={56} className="mx-auto text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Bài thi đang tạm dừng</h2>
            <p className="text-sm text-muted-foreground">Nhấn "Tiếp tục" để tiếp tục làm bài</p>
            <Button className="gradient-primary text-primary-foreground mt-2" onClick={() => setIsPaused(false)}>
              <Play size={16} className="mr-1" /> Tiếp tục
            </Button>
          </div>
        </div>
      )}

      {/* Passage tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 flex gap-1 py-2">
          {passages.map((p, i) => (
            <button key={i} onClick={() => setCurrentPassage(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i === currentPassage ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              Bài {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Split screen */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Left: Reading passage */}
        <div className="w-1/2 border-r border-border">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">{passage.title}</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                {passage.content.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed mb-4">{para}</p>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Questions */}
        <div className="w-1/2">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-6 space-y-6">
              <h3 className="font-semibold text-foreground">Câu hỏi – Bài {currentPassage + 1} ({passage.questions.length} câu)</h3>
              {passage.questions.map((q, qi) => {
                const gIdx = passages.slice(0, currentPassage).reduce((s, p) => s + p.questions.length, 0) + qi;
                return (
                  <div key={q.id} className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      <span className="text-primary mr-1">Câu {gIdx + 1}.</span> {q.question}
                    </h4>
                    <RadioGroup value={answers[q.id]?.toString()} onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: parseInt(v) }))} className="space-y-2">
                      {q.options.map((opt, i) => (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${answers[q.id] === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                          <RadioGroupItem value={i.toString()} id={`rq${q.id}-o${i}`} />
                          <Label htmlFor={`rq${q.id}-o${i}`} className="cursor-pointer flex-1 text-foreground">
                            <span className="font-medium text-muted-foreground mr-1">{String.fromCharCode(65 + i)}.</span>{opt}
                          </Label>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ReadingQuiz;
