import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle2, RotateCcw,
  FileText, Type, BookOpen, Loader2, PauseCircle, Play, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AnnotatedText, { type TextError } from "@/features/quiz/writing/components/AnnotatedText";
import { type WritingTask, tasks as mockTasks, sampleEssays as mockSampleEssays, writingGrammarPatterns } from "../mocks/writing.mock";
import { getPermissions, MOCK_TEST_NEXT_ROUTE, MOCK_TEST_NEXT_SKILL_LABEL } from "@/features/attempts/config/modePermissions";
import { attemptsService } from "@/features/attempts/services/attempts.service";
import MockTestTransition from "@/features/attempts/components/MockTestTransition";
import { examService, type ExamItem } from "@/features/quiz/services/exam.service";
import { writingApiService, type WritingResultResponse } from "../services/writing.api-service";

// ─── Config ──────────────────────────────────────────────────
const IS_API_MODE = import.meta.env.VITE_DATA_SOURCE === "api";
const TOTAL_TIME = 60 * 60;

// ─── Type helpers ────────────────────────────────────────────

interface ApiFeedback {
  source: "api";
  submissionId: string;
  score: number | null;
  feedback: string | null;
  status: string;
}

interface MockFeedback {
  source: "mock";
  taskAchievement: string;
  coherence: string;
  lexical: string;
  grammar: string;
  score: string;
  tips: string[];
  errors: TextError[];
}

type FeedbackResult = ApiFeedback | MockFeedback;

// Derive a WritingTask shape from ExamItem for API mode
function examToTask(exam: ExamItem, index: number): WritingTask {
  return {
    id: index + 1,
    title: exam.title,
    type: exam.skillType,
    duration: exam.duration,
    minWords: index === 0 ? 120 : 250,
    recommendedWords: index === 0 ? "150–200 từ" : "270–300 từ",
    scoreWeight: index === 0 ? "1/3 tổng điểm" : "2/3 tổng điểm",
    prompt: exam.description,
    instructions: [
      "Đọc kỹ yêu cầu đề bài trước khi viết",
      `Tối thiểu ${index === 0 ? "120" : "250"} từ`,
      "Kiểm tra ngữ pháp và chính tả trước khi nộp",
    ],
  };
}

// Grammar checker (used in mock mode only)
function findErrors(text: string): TextError[] {
  const errors: TextError[] = [];
  writingGrammarPatterns.forEach(({ regex, suggestion, explanation, type }) => {
    let match;
    const re = new RegExp(regex.source, regex.flags);
    while ((match = re.exec(text)) !== null) {
      const sug = typeof suggestion === "function" ? (suggestion as (m: string) => string)(match[0]) : suggestion;
      if (!sug) continue;
      errors.push({ start: match.index, end: match.index + match[0].length, original: match[0], suggestion: sug, explanation, type });
    }
  });
  errors.sort((a, b) => a.start - b.start);
  const filtered: TextError[] = [];
  let lastEnd = -1;
  for (const err of errors) {
    if (err.start >= lastEnd) { filtered.push(err); lastEnd = err.end; }
  }
  return filtered;
}

// ─── Component ───────────────────────────────────────────────

const WritingQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") ?? "practice";
  const examIdParam = searchParams.get("examId") ?? "";
  const session = searchParams.get("session") ?? "";
  const isMockSession = modeParam === "mock_test" && session === "mock";
  const perms = getPermissions(modeParam);

  // ── Exam / quiz data ──
  const [loading, setLoading] = useState(true);
  const [noExams, setNoExams] = useState(false);
  const [tasks, setTasks] = useState<WritingTask[]>(mockTasks);
  const [sampleEssays, setSampleEssays] = useState<Record<number, { level: string; content: string }>>(mockSampleEssays);
  // API mode: store examIds aligned by task index
  const [apiExamIds, setApiExamIds] = useState<string[]>([]);

  // ── Quiz state ──
  const [currentTask, setCurrentTask] = useState(0);
  const [writings, setWritings] = useState<Record<number, string>>({ 1: "", 2: "" });
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [showSample, setShowSample] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ── Feedback state ──
  const [feedbackTask, setFeedbackTask] = useState(0);
  const [feedbacks, setFeedbacks] = useState<Record<number, FeedbackResult>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string>("");

  // ── Mock-test saving ──
  const [mockSaving, setMockSaving] = useState(false);

  const groupId = searchParams.get("groupId") ?? "";

  // ── Load exams ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!IS_API_MODE) {
        setTasks(mockTasks);
        setSampleEssays(mockSampleEssays);
        setLoading(false);
        return;
      }
      try {
        // If examId provided in URL, treat as single-task session
        if (examIdParam) {
          // Use provided exam as task 1 only
          setApiExamIds([examIdParam]);
          setTasks([examToTask({ id: examIdParam, title: "Writing Task", description: "", duration: "60 phút", skillType: "writing" }, 0)]);
          setWritings({ 1: "" });
        } else if (groupId) {
          const exams = await examService.getExamsBySkill("writing");
          if (!active) return;
          const matched = exams.filter(e => {
            const groupMatch = e.description?.match(/group:([^;|\n]+)/);
            return groupMatch && groupMatch[1] === groupId;
          });
          if (matched.length === 0) {
            setNoExams(true);
            setLoading(false);
            return;
          }
          // Sort matched exams by title so Task 1 is first and Task 2 is second
          matched.sort((a, b) => a.title.localeCompare(b.title));
          const mapped = matched.map((e, i) => examToTask(e, i));
          setTasks(mapped);
          setApiExamIds(matched.map(e => e.id));
          const initialWritings: Record<number, string> = {};
          mapped.forEach((_, i) => { initialWritings[i + 1] = ""; });
          setWritings(initialWritings);
        } else {
          const exams = await examService.getExamsBySkill("writing");
          if (!active) return;
          if (exams.length === 0) {
            setNoExams(true);
            setLoading(false);
            return;
          }
          const mapped = exams.slice(0, 2).map((e, i) => examToTask(e, i));
          setTasks(mapped);
          setApiExamIds(exams.slice(0, 2).map(e => e.id));
          const initialWritings: Record<number, string> = {};
          mapped.forEach((_, i) => { initialWritings[i + 1] = ""; });
          setWritings(initialWritings);
        }
      } catch (err) {
        console.error("[WritingQuiz] Failed to load exams", err);
        // Fallback to mock
        setTasks(mockTasks);
        setSampleEssays(mockSampleEssays);
      }
      if (active) setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [examIdParam, groupId]);

  // ── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (loading || submitted || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 0) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitted, isPaused]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const reset = () => {
    const initialWritings: Record<number, string> = {};
    tasks.forEach((_, i) => { initialWritings[i + 1] = ""; });
    setWritings(initialWritings);
    setCurrentTask(0);
    setSubmitted(false);
    setTimeLeft(TOTAL_TIME);
    setFeedbacks({});
    setFeedbackTask(0);
    setIsPaused(false);
    setPollingStatus("");
  };

  // ── AI Feedback (practice mode) ─────────────────────────────
  const generateAIFeedback = async (taskIndex: number) => {
    if (aiLoading) return;
    setAiLoading(true);
    setPollingStatus("Đang gửi bài...");
    try {
      if (IS_API_MODE) {
        const task = tasks[taskIndex];
        const examId = apiExamIds[taskIndex] ?? "";
        const essayText = writings[task.id] ?? "";
        if (!examId || !essayText.trim()) {
          setAiLoading(false);
          return;
        }
        const submission = await writingApiService.submit(examId, task.prompt, essayText);
        setPollingStatus("Đang chờ AI chấm điểm...");
        const result = await writingApiService.pollUntilGraded(
          submission.writingSubmissionId,
          (status) => setPollingStatus(`Trạng thái: ${status}`)
        );
        const fb: ApiFeedback = {
          source: "api",
          submissionId: result.writingSubmissionId,
          score: result.score,
          feedback: result.feedback,
          status: result.status,
        };
        setFeedbacks(prev => ({ ...prev, [taskIndex]: fb }));
        await attemptsService.saveSkillAttempt("writing", { writings, writingFeedback: feedbacks });
      } else {
        // Mock mode
        const task = tasks[taskIndex];
        const text = writings[task.id] ?? "";
        const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
        const errors = findErrors(text);
        const { writingFeedbackAITemplates } = await import("../mocks/writing.mock");
        let fb: MockFeedback;
        if (wc < 20) {
          fb = { source: "mock", taskAchievement: "N/A", coherence: "N/A", lexical: "N/A", grammar: "N/A", score: "0/10", tips: ["Viết tối thiểu " + task.minWords + " từ để được đánh giá"], errors: [] };
        } else {
          const base = writingFeedbackAITemplates[task.id];
          fb = { source: "mock", ...base, errors };
        }
        setFeedbacks(prev => ({ ...prev, [taskIndex]: fb }));
        await attemptsService.saveSkillAttempt("writing", { writings, writingFeedback: feedbacks });
      }
    } catch (e) {
      console.error("[WritingQuiz] AI feedback error", e);
      setPollingStatus("Chấm điểm thất bại. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
      setPollingStatus("");
    }
  };

  // ── Submit (mock test) ──────────────────────────────────────
  const handleSubmit = async () => {
    setMockSaving(true);
    try {
      await attemptsService.saveSkillAttempt("writing", { writings });
      await new Promise(r => setTimeout(r, 300));
    } finally {
      setMockSaving(false);
    }
    setSubmitted(true);
  };

  // ─── Loading / empty states ──────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải đề thi Writing...</p>
        </div>
      </div>
    );
  }

  if (noExams) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto flex items-center justify-center">
              <AlertCircle size={32} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Đề Writing đang được cập nhật</h2>
            <p className="text-sm text-muted-foreground">
              Hiện chưa có đề thi Writing nào được xuất bản. Vui lòng quay lại sau.
            </p>
            <Button onClick={() => navigate("/quiz")} variant="outline" className="gap-2">
              <ArrowLeft size={16} /> Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const task = tasks[currentTask];
  const currentText = writings[task.id] ?? "";
  const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const meetsMinimum = wordCount >= task.minWords;

  // ── Mock test transition ──────────────────────────────────────
  if (submitted && isMockSession) {
    return (
      <MockTestTransition
        completedSkillLabel="Writing"
        nextSkillLabel={MOCK_TEST_NEXT_SKILL_LABEL["writing"]}
        nextRoute={`${MOCK_TEST_NEXT_ROUTE["writing"]}?mode=mock_test&session=mock`}
      />
    );
  }

  // ── Practice result / AI feedback screen ─────────────────────
  if (submitted) {
    const activeTask = tasks[feedbackTask];
    const activeText = writings[activeTask.id] ?? "";
    const activeWc = activeText.trim() ? activeText.trim().split(/\s+/).length : 0;
    const activeFb = feedbacks[feedbackTask];
    const hasFeedback = !!activeFb;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 h-14">
            <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} /> Quay lại
            </button>
            <h2 className="text-sm font-bold text-foreground">
              {hasFeedback ? "🤖 Kết quả chấm điểm AI" : "📝 Bài viết đã nộp"}
            </h2>
            <div className="flex items-center gap-2">
              {!hasFeedback ? (
                <Button
                  className="gradient-primary text-primary-foreground"
                  size="sm"
                  onClick={() => generateAIFeedback(feedbackTask)}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? <><Loader2 size={16} className="animate-spin" /> {pollingStatus || "Đang chấm..."}</>
                    : "🤖 Chấm điểm AI"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={reset}><RotateCcw size={16} /> Làm lại</Button>
              )}
            </div>
          </div>
        </header>

        {/* Polling status banner */}
        {aiLoading && pollingStatus && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 px-4 py-2">
            <p className="text-sm text-amber-700 dark:text-amber-400 text-center flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              {pollingStatus}
            </p>
          </div>
        )}

        {/* Task tabs */}
        <div className="bg-card border-b border-border">
          <div className="max-w-[1400px] mx-auto flex px-4 gap-1">
            {tasks.map((t, i) => (
              <button
                key={i}
                onClick={() => setFeedbackTask(i)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${i === feedbackTask ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t.title}
                {feedbacks[i] && (
                  <Badge className="ml-2 gradient-primary text-primary-foreground text-xs">
                    {(() => {
                      const fb = feedbacks[i];
                      if (fb.source === "api") return fb.score !== null ? `${fb.score}/10` : "✓";
                      return fb.score;
                    })()}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
          {/* Left: Essay */}
          <div className="flex-1 border-r border-border">
            <ScrollArea className="h-[calc(100vh-112px)]">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Bài viết của bạn
                  </h3>
                  <Badge
                    variant={activeWc >= activeTask.minWords ? "default" : "destructive"}
                    className={activeWc >= activeTask.minWords ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}
                  >
                    {activeWc} / {activeTask.minWords}+ từ
                  </Badge>
                </div>

                {hasFeedback && activeFb.source === "mock" && activeFb.errors.length > 0 ? (
                  <div className="bg-card rounded-xl p-5 border border-border">
                    <AnnotatedText text={activeText} errors={activeFb.errors} />
                  </div>
                ) : hasFeedback && activeFb.source === "mock" && activeFb.errors.length === 0 ? (
                  <div className="bg-card rounded-xl p-5 border border-border space-y-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle2 size={16} />
                      <span className="font-medium">Không phát hiện lỗi phổ biến. Bài viết khá tốt!</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{activeText}</p>
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
                {hasFeedback ? (
                  activeFb.source === "api" ? (
                    // API feedback
                    <>
                      <div className="text-center p-4 bg-muted/50 rounded-2xl">
                        <p className="text-xs text-muted-foreground mb-1">Điểm tổng</p>
                        <p className="text-3xl font-bold text-primary">
                          {activeFb.score !== null ? `${activeFb.score}/10` : "Đang chờ..."}
                        </p>
                        {activeFb.status === "failed" && (
                          <p className="text-xs text-destructive mt-1">Chấm điểm thất bại</p>
                        )}
                      </div>
                      {activeFb.feedback && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground">📋 Nhận xét của AI</h4>
                          <div className="bg-card rounded-xl p-4 border border-border">
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {activeFb.feedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Mock feedback
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
                          {activeFb.tips.map((tip, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 bg-muted/30 rounded-lg p-2.5">
                              <span className="text-primary mt-0.5">•</span>{tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )
                ) : (
                  <div className="text-center py-12 space-y-3">
                    {aiLoading ? (
                      <>
                        <Loader2 size={40} className="mx-auto text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">{pollingStatus || "Đang phân tích bài viết..."}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-muted">
                          <CheckCircle2 size={32} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Nhấn "Chấm điểm AI" để nhận<br />feedback chi tiết</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  }

  // ─── Writing screen ───────────────────────────────────────────
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
              <Button
                size="sm"
                variant={isPaused ? "default" : "outline"}
                onClick={() => setIsPaused(p => !p)}
                className={`gap-1.5 ${isPaused ? "gradient-primary text-primary-foreground" : ""}`}
              >
                {isPaused ? <><Play size={14} /> Tiếp tục</> : <><PauseCircle size={14} /> Tạm dừng</>}
              </Button>
            )}
            <div className="flex gap-1">
              {tasks.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTask(i)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${i === currentTask ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  Task {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMockSession && !IS_API_MODE && (
              <Button size="sm" variant="outline" onClick={() => setShowSample(true)} className="gap-1">
                <BookOpen size={14} /> Bài mẫu
              </Button>
            )}
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
              <span className="text-xs text-muted-foreground">{task.title}</span>
            </div>
            <Textarea
              className="flex-1 min-h-[400px] resize-none text-sm leading-relaxed rounded-xl"
              placeholder="Bắt đầu viết bài của bạn tại đây..."
              value={currentText}
              onChange={e => setWritings(p => ({ ...p, [task.id]: e.target.value }))}
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

      {/* Sample Essay Dialog (mock mode only) */}
      {!IS_API_MODE && (
        <Dialog open={showSample} onOpenChange={setShowSample}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><BookOpen size={20} /> Bài mẫu tham khảo – {task.title}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3">
                <Badge className="bg-emerald-100 text-emerald-700">Mức điểm: {sampleEssays[task.id as 1 | 2]?.level}</Badge>
                <div className="bg-muted/50 rounded-xl p-5">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{sampleEssays[task.id as 1 | 2]?.content}</p>
                </div>
                <p className="text-xs text-muted-foreground italic">* Bài mẫu tham khảo ở trình độ B2. Sử dụng để học cấu trúc và cách diễn đạt.</p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WritingQuiz;
