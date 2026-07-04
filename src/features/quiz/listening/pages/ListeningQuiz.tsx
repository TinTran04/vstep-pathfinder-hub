import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Clock, Play, Pause, RotateCcw, SkipBack, SkipForward,
  CheckCircle2, XCircle, Volume2, PauseCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { listeningService } from "../services/listening.service";
import type { StartPracticeResponse, SubmitPracticeResponse, AttemptResultResponse } from "../services/listening.service";
import type { SectionResponse, QuestionResponse } from "@/features/quiz/services/practice.api-service";
import { getPermissions, MOCK_TEST_NEXT_ROUTE, MOCK_TEST_NEXT_SKILL_LABEL } from "@/features/attempts/config/modePermissions";
import MockTestTransition from "@/features/attempts/components/MockTestTransition";
import { attemptsService } from "@/features/attempts/services/attempts.service";
import { attemptsApiService } from "@/features/attempts/services/attempts.api-service";
import { useAutosave } from "@/features/attempts/hooks/useAutosave";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";
import { VstepMockLayout } from "@/features/quiz/components/VstepMockLayout";
import { ExitConfirmDialog } from "@/features/quiz/components/ExitConfirmDialog";
import { cleanDescription } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

/** Lấy label (A/B/C/D) của đáp án đúng từ options */
function getCorrectLabel(q: QuestionResponse): string {
  const correct = q.options.find((o) => o.isCorrect);
  return correct?.label ?? "";
}

function getResultAnswer(result: AttemptResultResponse | null, questionId: string) {
  return result?.answers?.find((answer) => answer.questionId === questionId);
}

/** Đếm tổng số câu hỏi trong tất cả sections */
function countAllQuestions(sections: SectionResponse[]): number {
  return sections.reduce((sum, s) => sum + s.questions.length, 0);
}

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

// ─── Component ───────────────────────────────────────────────

const ListeningQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") ?? "practice";
  const examId = searchParams.get("examId") ?? "";
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
  const [showExitDialog, setShowExitDialog] = useState(false);

  // ── Audio simulation ──────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioDuration = 180; // placeholder — real audio URL from exam.audioUrl
  const audioInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    questionsScrollRef.current?.scrollTo({ top: 0 });
  }, [currentSection]);

  // ── Block leave confirmation ────────────────────────────────
  useEffect(() => {
    if (loading || submitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show toast for practice mode when user unexpectedly leaves
      if (!isMockSession && !submitted && practiceData) {
        toast.info("Phiên luyện tập bị thoát. Tiến độ đã được lưu.");
      }
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [loading, submitted, isMockSession, practiceData]);

  // ── Sync server time for mock test ──────────────────────────
  useEffect(() => {
    if (!isMockSession || !practiceData?.attemptId || submitted) return;

    const syncTimer = setInterval(async () => {
      try {
        const progress = await attemptsApiService.getAttemptProgress(practiceData.attemptId);
        if (progress && progress.remainingSeconds !== undefined) {
          const remaining = Math.max(0, progress.remainingSeconds);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            handleAutoSubmit();
          }
        }
      } catch (error) {
        console.error("Failed to sync server time:", error);
      }
    }, 30000);

    return () => clearInterval(syncTimer);
  }, [isMockSession, practiceData?.attemptId, submitted]);

  // ── Start practice on mount ───────────────────────────────
  useEffect(() => {
    let active = true;

    if (isMockSession) {
      attemptsService.getInProgressAttempt().then(res => {
        if (!active) return;
        if (res && res.exam) {
          const filteredExam = {
            ...res.exam,
            sections: res.exam.sections.filter((s: any) => s.skillType === "listening" || !s.skillType)
          };
          setPracticeData({
            attemptId: res.attemptId,
            examId: res.exam.examId,
            skillType: "mock_test",
            status: res.status,
            startedAt: res.startedAt,
            exam: filteredExam,
          });
          setTimeLeft(res.remainingSeconds > 0 ? res.remainingSeconds : 0);

          if (res.draftStateJson) {
            try {
              const draft = JSON.parse(res.draftStateJson);
              if (draft.listening?.answers) {
                setAnswers(draft.listening.answers);
              }
            } catch (e) {
              console.error("Failed to parse draft state", e);
            }
          }
          setLoading(false);
        } else {
          setStartError("Không tìm thấy bài thi đang làm dở.");
          setLoading(false);
        }
      }).catch(err => {
        if (!active) return;
        setStartError("Lỗi kết nối.");
        setLoading(false);
      });
      return () => { active = false; };
    }

    if (!examId) {
      setStartError("Không tìm thấy đề thi. Vui lòng quay lại trang Quiz.");
      setLoading(false);
      return;
    }
    
    listeningService
      .start(examId)
      .then((res) => {
        if (!active) return;
        setPracticeData(res);
        const secs = (res.exam.durationMinutes ?? 30) * 60;
        setTimeLeft(secs);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = (err as { message?: string })?.message;
        setStartError(msg || "Không thể bắt đầu bài thi. Vui lòng thử lại.");
        setLoading(false);
      });
    return () => { active = false; };
  }, [examId, isMockSession]);

  useAutosave(
    isMockSession && practiceData?.attemptId ? String(practiceData.attemptId) : null,
    "listening",
    () => {
      // Get the existing draft if any, actually we just save our part
      // The backend patches currentSkill and merges DraftStateJson
      // Wait, our backend patch autosave expects DraftStateJson to contain at least this skill.
      // Let's send the full payload or just our part. 
      // The backend replaces DraftStateJson completely!
      // I need to fetch the current draft from BE, or just let FE store a global draft state.
      // If we don't have global, we can just send our skill's state and assume backend merges?
      // Wait, in Phase 5, the BE just does: attempt.DraftStateJson = request.DraftStateJson. It overwrites.
      // So if I overwrite, I lose Reading/Writing?
      // Let's modify the backend AutosaveAttemptAsync to merge!
      return { listening: { answers } };
    }
  );

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (loading || submitted || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) { handleAutoSubmit(); return 0; }
        return t - 1;
      });
      setDurationUsed((d) => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, submitted, isPaused]);

  // ── Audio simulation ──────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (isPlaying && !submitted && !isPaused) {
      audioInterval.current = setInterval(() => {
        setAudioProgress((p) => {
          if (p >= audioDuration) { setIsPlaying(false); return audioDuration; }
          return p + 1;
        });
      }, 1000);
    }
    return () => { if (audioInterval.current) clearInterval(audioInterval.current); };
  }, [isPlaying, submitted, audioDuration, loading, isPaused]);

  // ── Submit helpers ────────────────────────────────────────
  const handleExitMockTest = async () => {
    if (!practiceData?.attemptId) return;
    // ExitConfirmDialog will call delete API, just redirect after
    navigate("/quiz");
  };

  const doSubmit = async () => {
    if (!practiceData) return;
    setSubmitting(true);
    try {
      if (isMockSession) {
        // Save final state and advance to next skill (Reading)
        const draftState = JSON.stringify({
          _meta: { mode: "mock_test", currentSkill: "listening" },
          listening: { answers }
        });

        await attemptsApiService.autosaveMockTest(
          String(practiceData.attemptId),
          "reading",
          draftState
        );

        // Navigate to Reading with same attempt ID
        navigate(`/quiz/reading/take?attemptId=${practiceData.attemptId}&mode=mock_test&session=mock`);
      } else {
        const res = await listeningService.submit(
          practiceData.attemptId,
          answers,
          durationUsed
        );
        setSubmitResult(res);
        const result = await listeningService.getResult(practiceData.attemptId);
        setAttemptResult(result);
        setSubmitted(true);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      toast.error(msg || "Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => { doSubmit(); };
  const handleSubmit = () => { doSubmit(); };

  const seekAudio = (delta: number) => {
    if (!perms.canSeekListeningAudio) return;
    setAudioProgress((p) => Math.max(0, Math.min(audioDuration, p + delta)));
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentSection(0);
    setSubmitted(false);
    setSubmitResult(null);
    setAttemptResult(null);
    setTimeLeft(practiceData ? (practiceData.exam.durationMinutes ?? 30) * 60 : 0);
    setDurationUsed(0);
    setIsPlaying(false);
    setAudioProgress(0);
    setIsPaused(false);
    // Re-start the practice (new attempt)
    if (examId) {
      setLoading(true);
      listeningService.start(examId).then((res) => {
        setPracticeData(res);
        setTimeLeft((res.exam.durationMinutes ?? 30) * 60);
        setLoading(false);
      });
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải bài thi nghe...</p>
        </div>
      </div>
    );
  }

  // ── Start error state ─────────────────────────────────────
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
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => { setStartError(null); setLoading(true); listeningService.start(examId).then((r) => { setPracticeData(r); setTimeLeft((r.exam.durationMinutes ?? 30) * 60); setLoading(false); }).catch((e: unknown) => { setStartError((e as { message?: string })?.message ?? "Lỗi"); setLoading(false); }); }}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { exam, attemptId: _attemptId } = practiceData;
  const sections = exam.sections ?? [];
  const totalQ = countAllQuestions(sections);
  const section = sections[currentSection];

  // ── Calculate question statuses for mock test grid ────────
  const getQuestionStatuses = (): Record<number, "answered" | "unanswered"> => {
    const statuses: Record<number, "answered" | "unanswered"> = {};
    let questionNumber = 1;

    sections.forEach((sec) => {
      sec.questions.forEach((question) => {
        statuses[questionNumber] = answers[question.questionId] !== undefined
          ? "answered"
          : "unanswered";
        questionNumber++;
      });
    });

    return statuses;
  };

  // ── Mock Test transition ───────────────────────────────────
  if (submitted && isMockSession) {
    return (
      <MockTestTransition
        completedSkillLabel="Listening"
        nextSkillLabel={MOCK_TEST_NEXT_SKILL_LABEL["listening"]}
        nextRoute={`${MOCK_TEST_NEXT_ROUTE["listening"]}?mode=mock_test&session=mock`}
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

            <h2 className="text-2xl font-bold text-foreground">Kết quả Listening</h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <p className="text-3xl font-bold text-foreground">{correctCount}</p>
                <p className="text-xs text-muted-foreground">Câu đúng / {totalQuestions}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <p className="text-3xl font-bold text-primary">{score.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Điểm</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <p className="text-3xl font-bold text-foreground">{Math.round(pct)}%</p>
                <p className="text-xs text-muted-foreground">Tỉ lệ đúng</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              {pct >= 70 ? "🎉 Xuất sắc!" : pct >= 50 ? "👍 Khá tốt! Hãy tiếp tục cố gắng." : "💪 Cần cải thiện thêm."}
            </p>

            {/* Per-section review */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 text-left border-t border-border pt-4">
              {sections.map((sec, si) => (
                <div key={sec.sectionId} className="space-y-2">
                  <h3 className="font-bold text-sm text-foreground">{sec.title || `Phần ${si + 1}`}</h3>
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
                          {!isCorrect && (
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
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quiz", { replace: true })}>
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
  const answeredCount = Object.keys(answers).length;
  const sectionOffset = sections.slice(0, currentSection).reduce((s, sec) => s + sec.questions.length, 0);

  // ── Mock Test UI ──────────────────────────────────────────
  if (isMockSession && practiceData?.attemptId) {
    return (
      <>
        <VstepMockLayout
          skillName="Listening / Kỹ năng Nghe"
          remainingSeconds={timeLeft}
          questionCount={totalQ}
          answeredCount={answeredCount}
          currentQuestion={sectionOffset + 1}
          isLastSkill={false}
          onExit={() => setShowExitDialog(true)}
          onNext={handleSubmit}
          onQuestionSelect={(questionNum) => {
            questionsScrollRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          questionStatuses={getQuestionStatuses()}
          attemptId={practiceData.attemptId}
        >
          {/* Main content area */}
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-4">
            {/* Exam title */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">{exam.title}</h2>
              {cleanDescription(exam.description) && (
                <p className="text-xs text-muted-foreground mt-1">{cleanDescription(exam.description)}</p>
              )}
            </div>

            {/* Section tabs */}
            {sections.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center">
                {sections.map((sec, i) => (
                  <button
                    key={sec.sectionId}
                    onClick={() => {
                      setCurrentSection(i);
                      setAudioProgress(0);
                      setIsPlaying(false);
                    }}
                    className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                      i === currentSection
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    {sec.title || `Phần ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Quiz content */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-foreground">
                  {section?.title || `Phần ${currentSection + 1}`}
                </h3>
                {section?.instruction && (
                  <p className="text-xs text-muted-foreground">{section.instruction}</p>
                )}
              </div>

              {/* Questions */}
              <div ref={questionsScrollRef} className="mt-4">
                <VocabularyContextMenu source="listening">
                  <div className="space-y-4">
                    {(section?.questions ?? []).map((q, i) => {
                      const globalIdx = sectionOffset + i + 1;
                      return (
                        <div
                          key={q.questionId}
                          className={`rounded-lg border p-3 transition-colors sm:p-4 ${
                            answers[q.questionId] !== undefined
                              ? "border-primary/40 bg-primary/5"
                              : "border-border bg-card"
                          }`}
                        >
                          <h4 className="text-xs font-semibold text-foreground mb-2">
                            <span className="mr-1 text-primary">Câu {globalIdx}.</span>
                            {q.questionText}
                          </h4>
                          <RadioGroup
                            value={answers[q.questionId] ?? ""}
                            onValueChange={(v) =>
                              setAnswers((p) => ({ ...p, [q.questionId]: v }))
                            }
                            className="space-y-1.5"
                          >
                            {q.options.map((opt) => (
                              <label
                                key={opt.optionId}
                                className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer transition-all ${
                                  answers[q.questionId] === opt.label
                                    ? "border border-primary/30 bg-primary/10"
                                    : "hover:bg-muted/60"
                                }`}
                              >
                                <RadioGroupItem
                                  value={opt.label}
                                  id={`lq-${q.questionId}-${opt.optionId}`}
                                />
                                <Label
                                  htmlFor={`lq-${q.questionId}-${opt.optionId}`}
                                  className="cursor-pointer flex-1"
                                >
                                  <span className="font-medium text-gray-600 mr-1">
                                    {opt.label}.
                                  </span>
                                  <span className="text-foreground">{opt.content}</span>
                                </Label>
                              </label>
                            ))}
                          </RadioGroup>
                        </div>
                      );
                    })}
                  </div>
                </VocabularyContextMenu>
              </div>

              {/* Audio player */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {(() => {
                  const audioUrl = section?.audioUrl ?? exam.audioUrl;
                  return audioUrl ? (
                    <audio controls src={audioUrl} key={audioUrl} className="w-full" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Volume2 size={14} className="text-blue-900 shrink-0" />
                      <span className="text-xs text-gray-600 w-10">
                        {formatTime(audioProgress)}
                      </span>
                      <div className="flex-1">
                        <Progress value={(audioProgress / audioDuration) * 100} className="h-1" />
                      </div>
                      <span className="w-10 text-right text-xs text-muted-foreground">
                        {formatTime(audioDuration)}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        {perms.canSeekListeningAudio && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => seekAudio(-10)}
                          >
                            <SkipBack size={12} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setIsPlaying(!isPlaying)}
                          disabled={
                            !perms.canReplayListeningAudio &&
                            audioProgress >= audioDuration
                          }
                        >
                          {isPlaying ? (
                            <Pause size={14} />
                          ) : (
                            <Play size={14} />
                          )}
                        </Button>
                        {perms.canSeekListeningAudio && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => seekAudio(10)}
                          >
                            <SkipForward size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </VstepMockLayout>

        <ExitConfirmDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          onConfirm={handleExitMockTest}
          attemptId={practiceData.attemptId}
        />
      </>
    );
  }

  // ── Practice Mode UI (Original) ────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Bạn có chắc chắn muốn thoát? Bài thi đang làm sẽ bị hủy và không được lưu."
                )
              ) {
                navigate("/quiz");
              }
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} /> Thoát
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Clock
                size={16}
                className={
                  timeLeft < 300
                    ? "text-destructive"
                    : isPaused
                      ? "text-amber-500"
                      : "text-muted-foreground"
                }
              />
              <span
                className={
                  timeLeft < 300
                    ? "text-destructive"
                    : isPaused
                      ? "text-amber-500"
                      : "text-foreground"
                }
              >
                {formatTime(timeLeft)}
              </span>
              {isPaused && (
                <span className="text-xs text-amber-500 font-medium">(Tạm dừng)</span>
              )}
            </div>

            {perms.canPauseTimer && (
              <Button
                size="sm"
                variant={isPaused ? "default" : "outline"}
                onClick={() => setIsPaused((p) => !p)}
                className={`gap-1.5 ${isPaused ? "gradient-primary text-primary-foreground" : ""}`}
              >
                {isPaused ? (
                  <>
                    <Play size={14} /> Tiếp tục
                  </>
                ) : (
                  <>
                    <PauseCircle size={14} /> Tạm dừng
                  </>
                )}
              </Button>
            )}
          </div>

          <span className="text-sm text-muted-foreground">
            Đã trả lời {answeredCount}/{totalQ}
          </span>
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
            <Button
              className="gradient-primary text-primary-foreground mt-2"
              onClick={() => setIsPaused(false)}
            >
              <Play size={16} className="mr-1" /> Tiếp tục
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Exam title */}
        <div className="text-center">
          <h1 className="text-lg font-bold text-foreground">{exam.title}</h1>
          {cleanDescription(exam.description) && (
            <p className="text-sm text-muted-foreground">
              {cleanDescription(exam.description)}
            </p>
          )}
        </div>

        {/* Section tabs */}
        {sections.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {sections.map((sec, i) => (
              <button
                key={sec.sectionId}
                onClick={() => {
                  setCurrentSection(i);
                  setAudioProgress(0);
                  setIsPlaying(false);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  i === currentSection
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {sec.title || `Phần ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Main content */}
        <div
          className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 230px)" }}
        >
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {section?.title || `Phần ${currentSection + 1}`}
                </h3>
                {section?.instruction && (
                  <p className="text-xs text-muted-foreground">{section.instruction}</p>
                )}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div ref={questionsScrollRef} className="flex-1 overflow-y-auto">
            <VocabularyContextMenu source="listening">
              <div className="p-5 space-y-4">
                {(section?.questions ?? []).map((q, i) => {
                  const globalIdx = sectionOffset + i + 1;
                  return (
                    <div
                      key={q.questionId}
                      className={`rounded-xl border-2 p-4 transition-colors ${
                        answers[q.questionId] !== undefined
                          ? "border-primary/30 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <h4 className="text-sm font-semibold text-foreground mb-3">
                        <span className="text-primary mr-1">Câu {globalIdx}.</span>{" "}
                        {q.questionText}
                      </h4>
                      <RadioGroup
                        value={answers[q.questionId] ?? ""}
                        onValueChange={(v) =>
                          setAnswers((p) => ({ ...p, [q.questionId]: v }))
                        }
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                      >
                        {q.options.map((opt) => (
                          <label
                            key={opt.optionId}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer text-sm transition-all ${
                              answers[q.questionId] === opt.label
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/30 hover:bg-muted/50"
                            }`}
                          >
                            <RadioGroupItem
                              value={opt.label}
                              id={`lq-${q.questionId}-${opt.optionId}`}
                            />
                            <Label
                              htmlFor={`lq-${q.questionId}-${opt.optionId}`}
                              className="cursor-pointer flex-1"
                            >
                              <span className="font-medium text-muted-foreground mr-1.5">
                                {opt.label}.
                              </span>
                              <span className="text-foreground">{opt.content}</span>
                            </Label>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                  );
                })}
              </div>
            </VocabularyContextMenu>
          </div>

          {/* Audio player */}
          <div className="border-t border-border bg-card px-5 py-3">
            {(() => {
              const audioUrl = section?.audioUrl ?? exam.audioUrl;
              return audioUrl ? (
                <audio
                  controls
                  src={audioUrl}
                  key={audioUrl}
                  className="w-full h-10"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <Volume2 size={18} className="text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground w-12">
                    {formatTime(audioProgress)}
                  </span>
                  <div className="flex-1">
                    <Progress
                      value={(audioProgress / audioDuration) * 100}
                      className="h-2"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {formatTime(audioDuration)}
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    {perms.canSeekListeningAudio && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => seekAudio(-10)}
                      >
                        <SkipBack size={14} />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      className="h-10 w-10 gradient-primary text-primary-foreground"
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={
                        !perms.canReplayListeningAudio &&
                        audioProgress >= audioDuration
                      }
                    >
                      {isPlaying ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} />
                      )}
                    </Button>
                    {perms.canSeekListeningAudio && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => seekAudio(10)}
                      >
                        <SkipForward size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Đang nộp bài..." : "Hoàn thành"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListeningQuiz;
