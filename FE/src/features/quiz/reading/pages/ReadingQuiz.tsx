import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, RotateCcw,
  BookOpen, PauseCircle, Play, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { readingService } from "../services/reading.service";
import type { AttemptResultResponse, StartPracticeResponse, SubmitPracticeResponse } from "../services/reading.service";
import type { SectionResponse, QuestionResponse } from "@/features/quiz/services/practice.api-service";
import { getPermissions, MOCK_TEST_NEXT_ROUTE, MOCK_TEST_NEXT_SKILL_LABEL } from "@/features/attempts/config/modePermissions";
import MockTestTransition from "@/features/attempts/components/MockTestTransition";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";
import { examService } from "@/features/quiz/services/exam.service";
import { attemptsService } from "@/features/attempts/services/attempts.service";

// ─── Helpers ─────────────────────────────────────────────────

function getCorrectLabel(q: QuestionResponse): string {
  return q.options.find((o) => o.isCorrect)?.label ?? "";
}

function getResultAnswer(result: AttemptResultResponse | null, questionId: string) {
  return result?.answers?.find((answer) => answer.questionId === questionId);
}

function countAllQuestions(sections: SectionResponse[]): number {
  return sections.reduce((sum, s) => sum + s.questions.length, 0);
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

// ─── Component ───────────────────────────────────────────────

const ReadingQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") ?? "practice";
  const examIdParam = searchParams.get("examId") ?? "";
  const groupId = searchParams.get("groupId") ?? "";
  const [resolvedExamId, setResolvedExamId] = useState(examIdParam);
  const session = searchParams.get("session") ?? "";
  const isMockSession = modeParam === "mock_test" && session === "mock";
  const perms = getPermissions(modeParam);

  // ── Session state ─────────────────────────────────────────
  const [practiceData, setPracticeData] = useState<StartPracticeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  // ── Quiz state ────────────────────────────────────────────
  const [currentSection, setCurrentSection] = useState(0);
  /** answers: Map<questionId (GUID), optionLabel ("A"|"B"|...)> */
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitPracticeResponse | null>(null);
  const [attemptResult, setAttemptResult] = useState<AttemptResultResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [durationUsed, setDurationUsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const passageScrollRef = useRef<HTMLDivElement>(null);
  const questionsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    passageScrollRef.current
      ?.querySelector("[data-radix-scroll-area-viewport]")
      ?.scrollTo({ top: 0 });
    questionsScrollRef.current
      ?.querySelector("[data-radix-scroll-area-viewport]")
      ?.scrollTo({ top: 0 });
  }, [currentSection]);

  // ── Resolve examId from groupId if needed ──────────────────
  useEffect(() => {
    if (!resolvedExamId && groupId) {
      examService.getExamsBySkill("reading")
        .then((exams) => {
          const matched = exams.find(e => {
            const groupMatch = e.description?.match(/group:([^;|\n]+)/);
            return groupMatch && groupMatch[1] === groupId;
          });
          if (matched) {
            setResolvedExamId(matched.id);
          } else {
            setStartError("Không tìm thấy đề thi Reading cho nhóm thi thử này.");
            setLoading(false);
          }
        })
        .catch((err) => {
          setStartError("Không thể tải thông tin đề thi Reading.");
          setLoading(false);
        });
    }
  }, [resolvedExamId, groupId]);

  // ── Start practice on mount ───────────────────────────────
  useEffect(() => {
    if (!resolvedExamId) {
      if (groupId) return; // Wait for resolving
      setStartError("Không tìm thấy đề thi. Vui lòng quay lại trang Quiz.");
      setLoading(false);
      return;
    }
    let active = true;
    readingService
      .start(resolvedExamId)
      .then((res) => {
        if (!active) return;
        setPracticeData(res);
        setTimeLeft((res.exam.durationMinutes ?? 60) * 60);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = (err as { message?: string })?.message;
        setStartError(msg || "Không thể bắt đầu bài thi. Vui lòng thử lại.");
        setLoading(false);
      });
    return () => { active = false; };
  }, [resolvedExamId, groupId]);

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (loading || submitted || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) { doSubmit(); return 0; }
        return t - 1;
      });
      setDurationUsed((d) => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, submitted, isPaused]);

  // ── Submit ────────────────────────────────────────────────
  const doSubmit = async () => {
    if (!practiceData || submitting) return;
    setSubmitting(true);
    try {
      const res = await readingService.submit(practiceData.attemptId, answers, durationUsed);
      setSubmitResult(res);
      const result = await readingService.getResult(practiceData.attemptId);
      setAttemptResult(result);
      if (isMockSession) {
        await attemptsService.saveSkillAttempt("reading", {
          score: result?.score ?? res.score,
          totalQuestions: result?.totalQuestions ?? res.totalQuestions,
          answers: answers,
        });
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      toast.error(msg || "Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentSection(0);
    setSubmitted(false);
    setSubmitResult(null);
    setAttemptResult(null);
    setDurationUsed(0);
    setIsPaused(false);
    if (examId) {
      setLoading(true);
      readingService.start(examId).then((res) => {
        setPracticeData(res);
        setTimeLeft((res.exam.durationMinutes ?? 60) * 60);
        setLoading(false);
      });
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải bài thi đọc...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (startError || !practiceData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Không thể tải bài thi</h2>
            <p className="text-sm text-muted-foreground">{startError}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quiz")}>
                <ArrowLeft size={16} className="mr-1" /> Quay lại
              </Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => {
                setStartError(null); setLoading(true);
                readingService.start(examId)
                  .then((r) => { setPracticeData(r); setTimeLeft((r.exam.durationMinutes ?? 60) * 60); setLoading(false); })
                  .catch((e: unknown) => { setStartError((e as { message?: string })?.message ?? "Lỗi"); setLoading(false); });
              }}>Thử lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { exam } = practiceData;
  const sections = exam.sections ?? [];
  const totalQ = countAllQuestions(sections);
  const section = sections[currentSection];
  const answeredCount = Object.keys(answers).length;
  const sectionOffset = sections.slice(0, currentSection).reduce((s, sec) => s + sec.questions.length, 0);

  // ── Mock Test transition ───────────────────────────────────
  if (submitted && isMockSession) {
    return (
      <MockTestTransition
        completedSkillLabel="Reading"
        nextSkillLabel={MOCK_TEST_NEXT_SKILL_LABEL["reading"]}
        nextRoute={`${MOCK_TEST_NEXT_ROUTE["reading"]}?mode=mock_test&session=mock`}
      />
    );
  }

  // ── Result screen ─────────────────────────────────────────
  if (submitted && submitResult) {
    const score = attemptResult?.score ?? submitResult.score;
    const correctCount = attemptResult?.correctCount ?? submitResult.correctCount;
    const totalQuestions = attemptResult?.totalQuestions ?? submitResult.totalQuestions;
    const pct = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border">
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${pct >= 70 ? "bg-emerald-100" : pct >= 50 ? "bg-amber-100" : "bg-red-100"}`}>
              {pct >= 70
                ? <CheckCircle2 size={40} className="text-emerald-600" />
                : <XCircle size={40} className={pct >= 50 ? "text-amber-600" : "text-red-600"} />}
            </div>

            <h2 className="text-2xl font-bold text-foreground">Kết quả Reading</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <p className="text-3xl font-bold text-foreground">{correctCount}</p>
                <p className="text-xs text-muted-foreground">Câu đúng / {totalQuestions}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <p className="text-3xl font-bold text-primary">{(score ?? 0).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Điểm</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <p className="text-3xl font-bold text-foreground">{Math.round(pct)}%</p>
                <p className="text-xs text-muted-foreground">Tỉ lệ đúng</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              {pct >= 70 ? "🎉 Xuất sắc!" : pct >= 50 ? "👍 Khá tốt!" : "💪 Cần cải thiện thêm."}
            </p>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 text-left border-t border-border pt-4">
              {sections.map((sec, si) => (
                <div key={sec.sectionId} className="space-y-2">
                  <h3 className="font-bold text-sm text-foreground">{sec.title || `Đoạn văn ${si + 1}`}</h3>
                  {sec.questions.map((q, qi) => {
                    const globalIdx = sections.slice(0, si).reduce((s, s2) => s + s2.questions.length, 0) + qi + 1;
                    const answerReview = getResultAnswer(attemptResult, q.questionId);
                    const userAnswer = answerReview?.userAnswer ?? answers[q.questionId];
                    const correctLabel = answerReview?.correctAnswer ?? getCorrectLabel(q);
                    const isCorrect = answerReview?.isCorrect ?? (Boolean(correctLabel) && userAnswer === correctLabel);
                    return (
                      <div key={q.questionId} className={`p-4 rounded-xl border-2 space-y-2 ${isCorrect ? "bg-emerald-50/50 border-emerald-200" : "bg-red-50/50 border-red-200"}`}>
                        <div className="flex items-start gap-2 justify-between">
                          <h4 className="text-xs font-semibold text-foreground leading-relaxed">
                            Câu {globalIdx}: {q.questionText}
                          </h4>
                          <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-emerald-600 shrink-0" : "shrink-0"}>
                            {isCorrect ? "Đúng" : "Sai"}
                          </Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-muted-foreground">
                            Bạn chọn: <span className={`font-semibold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>{userAnswer || "Chưa trả lời"}</span>
                          </p>
                          {!isCorrect && correctLabel && (
                            <p className="text-muted-foreground">
                              Đáp án đúng: <span className="font-semibold text-emerald-700">{correctLabel}</span>
                            </p>
                          )}
                          {(answerReview?.explanation || q.explanation) && (
                            <div className="mt-2 p-2.5 bg-background/50 border border-border rounded-lg">
                              <p className="font-semibold text-xs text-foreground mb-1">💡 Giải thích:</p>
                              <p className="text-muted-foreground leading-relaxed">{answerReview?.explanation || q.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quiz")}>
                <ArrowLeft size={16} className="mr-1" /> Quay lại
              </Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleReset}>
                <RotateCcw size={16} className="mr-1" /> Làm lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────
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
              <Button size="sm" variant={isPaused ? "default" : "outline"} onClick={() => setIsPaused((p) => !p)}
                className={`gap-1.5 ${isPaused ? "gradient-primary text-primary-foreground" : ""}`}>
                {isPaused ? <><Play size={14} /> Tiếp tục</> : <><PauseCircle size={14} /> Tạm dừng</>}
              </Button>
            )}
            <span className="text-sm text-muted-foreground">Đã trả lời {answeredCount}/{totalQ}</span>
          </div>
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={doSubmit} disabled={submitting}>
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </Button>
        </div>
        <Progress value={(answeredCount / totalQ) * 100} className="h-1" />
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

      {/* Section tabs */}
      {sections.length > 1 && (
        <div className="bg-card border-b border-border">
          <div className="max-w-[1400px] mx-auto px-4 flex gap-1 py-2">
            {sections.map((sec, i) => (
              <button key={sec.sectionId} onClick={() => setCurrentSection(i)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i === currentSection ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {sec.title || `Bài ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Split screen */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Left: Passage text */}
        <div className="w-1/2 border-r border-border">
          <div ref={passageScrollRef}>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={20} className="text-primary" />
                  <h2 className="text-lg font-bold text-foreground">{section?.title || `Đoạn văn ${currentSection + 1}`}</h2>
                </div>
                {section?.instruction && (
                  <p className="text-sm text-muted-foreground mb-4 italic">{section.instruction}</p>
                )}
                <VocabularyContextMenu source="reading">
                  <div className="prose prose-sm max-w-none">
                    {(section?.passageText ?? "Chưa có nội dung đoạn văn.").split("\n\n").map((para, i) => (
                      <p key={i} className="text-sm text-foreground leading-relaxed mb-4">{para}</p>
                    ))}
                  </div>
                </VocabularyContextMenu>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right: Questions */}
        <div className="w-1/2">
          <div ref={questionsScrollRef}>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="p-6 space-y-6">
                <h3 className="font-semibold text-foreground">
                  Câu hỏi – {section?.title || `Bài ${currentSection + 1}`}
                </h3>
                {(section?.questions ?? []).map((q, qi) => {
                  const globalIdx = sectionOffset + qi + 1;
                  return (
                    <div key={q.questionId} className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        <span className="text-primary mr-1">Câu {globalIdx}.</span> {q.questionText}
                      </h4>
                      <RadioGroup
                        value={answers[q.questionId] ?? ""}
                        onValueChange={(v) => setAnswers((p) => ({ ...p, [q.questionId]: v }))}
                        className="space-y-2"
                      >
                        {q.options.map((opt) => (
                          <label key={opt.optionId}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${answers[q.questionId] === opt.label ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                            <RadioGroupItem value={opt.label} id={`rq-${q.questionId}-${opt.optionId}`} />
                            <Label htmlFor={`rq-${q.questionId}-${opt.optionId}`} className="cursor-pointer flex-1 text-foreground">
                              <span className="font-medium text-muted-foreground mr-1">{opt.label}.</span>{opt.content}
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
    </div>
  );
};

export default ReadingQuiz;
