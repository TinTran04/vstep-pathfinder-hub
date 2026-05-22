import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, RotateCcw, FileText, Type, BookOpen, Loader2, PauseCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AnnotatedText, { type TextError } from "@/features/quiz/writing/components/AnnotatedText";
import { type WritingTask } from "../mocks/writing.mock";
import { writingService } from "../services/writing.service";
import { getPermissions, MOCK_TEST_NEXT_ROUTE, MOCK_TEST_NEXT_SKILL_LABEL } from "@/features/attempts/config/modePermissions";
import { attemptsService } from "@/features/attempts/services/attempts.service";
import MockTestTransition from "@/features/attempts/components/MockTestTransition";

const TOTAL_TIME = 60 * 60;

const WritingQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") ?? "practice";
  const session = searchParams.get("session") ?? "";
  const isMockSession = modeParam === "mock_test" && session === "mock";
  const perms = getPermissions(modeParam);

  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<{
    tasks: WritingTask[];
    sampleEssays: Record<number, { level: string; content: string }>;
  } | null>(null);
  const [currentTask, setCurrentTask] = useState(0);
  const [writings, setWritings] = useState<Record<number, string>>({ 1: "", 2: "" });
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [showSample, setShowSample] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // AI Feedback (practice mode)
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<Record<number, { taskAchievement: string; coherence: string; lexical: string; grammar: string; score: string; tips: string[]; errors: TextError[] }>>({});
  const [feedbackTask, setFeedbackTask] = useState(0);

  // Mock test saving state
  const [mockSaving, setMockSaving] = useState(false);

  useEffect(() => {
    let active = true;
    writingService.getWritingQuiz().then((data) => {
      if (active) {
        setQuizData(data);
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

  const reset = () => {
    setWritings({ 1: "", 2: "" }); setCurrentTask(0); setSubmitted(false);
    setTimeLeft(TOTAL_TIME); setShowAIFeedback(false); setAiFeedback({});
    setFeedbackTask(0); setIsPaused(false);
  };

  const generateAIFeedback = async () => {
    setAiLoading(true);
    try {
      const feedback = await writingService.generateWritingFeedback(writings);
      setAiFeedback(feedback);
      setShowAIFeedback(true);
      await attemptsService.saveSkillAttempt("writing", {
        writings,
        writingFeedback: feedback,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    setMockSaving(true);
    await attemptsService.saveSkillAttempt("writing", {
      writings,
      writingFeedback: Object.keys(aiFeedback).length > 0 ? aiFeedback : undefined,
    });
    await new Promise((r) => setTimeout(r, 300)); // slight delay for UX
    setMockSaving(false);
    setSubmitted(true);
  };

  if (loading || !quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải đề thi Writing...</p>
        </div>
      </div>
    );
  }

  const { tasks, sampleEssays } = quizData;
  const task = tasks[currentTask];
  const currentText = writings[task.id] || "";
  const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const meetsMinimum = wordCount >= task.minWords;

  // Mock test: show transition to Speaking
  if (submitted && isMockSession) {
    return (
      <MockTestTransition
        completedSkillLabel="Writing"
        nextSkillLabel={MOCK_TEST_NEXT_SKILL_LABEL["writing"]}
        nextRoute={`${MOCK_TEST_NEXT_ROUTE["writing"]}?mode=mock_test&session=mock`}
      />
    );
  }

  // Practice: show results + AI feedback
  if (submitted) {
    const activeTask = tasks[feedbackTask];
    const activeText = writings[activeTask.id] || "";
    const activeWc = activeText.trim() ? activeText.trim().split(/\s+/).length : 0;
    const activeFb = aiFeedback[activeTask.id];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 h-14">
            <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} /> Quay lại
            </button>
            <h2 className="text-sm font-bold text-foreground">
              {showAIFeedback ? "🤖 Kết quả chấm điểm AI" : "📝 Bài viết đã nộp"}
            </h2>
            <div className="flex items-center gap-2">
              {!showAIFeedback ? (
                <Button className="gradient-primary text-primary-foreground" size="sm" onClick={generateAIFeedback} disabled={aiLoading}>
                  {aiLoading ? <><Loader2 size={16} className="animate-spin" /> Đang chấm...</> : "🤖 Chấm điểm AI"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={reset}><RotateCcw size={16} /> Làm lại</Button>
              )}
            </div>
          </div>
        </header>

        {/* Task tabs */}
        <div className="bg-card border-b border-border">
          <div className="max-w-[1400px] mx-auto flex px-4 gap-1">
            {tasks.map((t, i) => (
              <button key={i} onClick={() => setFeedbackTask(i)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${i === feedbackTask ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t.title}
                {showAIFeedback && activeFb && i === feedbackTask && (
                  <Badge className="ml-2 gradient-primary text-primary-foreground text-xs">{aiFeedback[t.id]?.score}</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
          {/* Left: Annotated essay */}
          <div className="flex-1 border-r border-border">
            <ScrollArea className="h-[calc(100vh-112px)]">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Bài viết của bạn
                  </h3>
                  <Badge variant={activeWc >= activeTask.minWords ? "default" : "destructive"}
                    className={activeWc >= activeTask.minWords ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>
                    {activeWc} / {activeTask.minWords}+ từ
                  </Badge>
                </div>

                {showAIFeedback && activeFb ? (
                  <div className="bg-card rounded-xl p-5 border border-border">
                    {activeFb.errors && activeFb.errors.length > 0 ? (
                      <AnnotatedText text={activeText} errors={activeFb.errors} />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                          <CheckCircle2 size={16} />
                          <span className="font-medium">Không phát hiện lỗi phổ biến. Bài viết khá tốt!</span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{activeText}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card rounded-xl p-5 border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {activeText || <span className="text-muted-foreground italic">Chưa viết</span>}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Scores & Tips */}
          <div className="w-[380px] shrink-0">
            <ScrollArea className="h-[calc(100vh-112px)]">
              <div className="p-6 space-y-5">
                {showAIFeedback && activeFb ? (
                  <>
                    <div className="text-center p-4 bg-muted/50 rounded-2xl">
                      <p className="text-xs text-muted-foreground mb-1">Điểm tổng</p>
                      <p className="text-3xl font-bold text-primary">{activeFb.score}</p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">📊 Đánh giá theo tiêu chí</h4>
                      {[
                        { label: "📋 Task Achievement", value: activeFb.taskAchievement },
                        { label: "🔗 Coherence & Cohesion", value: activeFb.coherence },
                        { label: "📚 Lexical Resource", value: activeFb.lexical },
                        { label: "📝 Grammar", value: activeFb.grammar },
                      ].map(item => (
                        <div key={item.label} className="bg-card rounded-xl p-3 border border-border">
                          <p className="text-xs font-semibold text-foreground mb-1">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">💡 Gợi ý cải thiện</h4>
                      <ul className="space-y-2">
                        {activeFb.tips.map((tip: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 bg-muted/30 rounded-lg p-2.5">
                            <span className="text-primary mt-0.5">•</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-muted">
                      <CheckCircle2 size={32} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nhấn "Chấm điểm AI" để nhận<br/>feedback chi tiết theo 4 tiêu chí</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
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
          <div className="flex items-center gap-4">
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
            <div className="flex gap-1">
              {tasks.map((t, i) => (
                <button key={i} onClick={() => setCurrentTask(i)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${i === currentTask ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  Task {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowSample(true)} className="gap-1">
              <BookOpen size={14} /> Bài mẫu
            </Button>
            {currentTask === tasks.length - 1 ? (
              <Button className="gradient-primary text-primary-foreground" size="sm" onClick={handleSubmit} disabled={mockSaving}>
                {mockSaving ? <><Loader2 size={14} className="animate-spin" /> Đang lưu...</> : "Hoàn thành"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCurrentTask(1)}>Task tiếp <ArrowRight size={16} /></Button>
            )}
          </div>
        </div>
        <Progress value={((currentTask + 1) / tasks.length) * 100} className="h-1" />
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

      {/* Split screen */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Left: Prompt */}
        <div className="w-1/2 border-r border-border">
          <ScrollArea className="h-[calc(100vh-64px)]">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">{task.title}</h2>
              </div>
              <Card className="border-border bg-muted/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3">Đề bài</h3>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{task.prompt}</div>
                </CardContent>
              </Card>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Hướng dẫn</h3>
                <ul className="space-y-2">
                  {task.instructions.map((inst, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>{inst}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Editor */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Type size={18} className="text-primary" />
                <span className="font-semibold text-foreground text-sm">Bài viết của bạn</span>
              </div>
              <span className="text-xs text-muted-foreground">Khuyến nghị: {task.recommendedWords}</span>
            </div>
            <Textarea
              className="flex-1 min-h-[400px] resize-none text-sm leading-relaxed rounded-xl"
              placeholder="Bắt đầu viết bài của bạn tại đây..."
              value={currentText}
              onChange={(e) => setWritings((p) => ({ ...p, [task.id]: e.target.value }))}
              disabled={isPaused}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${meetsMinimum ? "text-emerald-600" : "text-destructive"}`}>
                  {wordCount} từ
                </span>
                <span className="text-xs text-muted-foreground">/ tối thiểu {task.minWords} từ</span>
              </div>
              <Progress value={Math.min(100, (wordCount / task.minWords) * 100)} className="w-32 h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Sample Essay Dialog */}
      <Dialog open={showSample} onOpenChange={setShowSample}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen size={20} /> Bài mẫu tham khảo – {task.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              <Badge className="bg-emerald-100 text-emerald-700">Mức điểm: {sampleEssays[task.id as 1 | 2].level}</Badge>
              <div className="bg-muted/50 rounded-xl p-5">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{sampleEssays[task.id as 1 | 2].content}</p>
              </div>
              <p className="text-xs text-muted-foreground italic">* Bài mẫu tham khảo ở trình độ B2. Sử dụng để học cấu trúc và cách diễn đạt.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WritingQuiz;
