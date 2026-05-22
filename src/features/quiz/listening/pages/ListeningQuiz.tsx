import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, Play, Pause, RotateCcw, SkipBack, SkipForward, CheckCircle2, XCircle, Volume2, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { type Part } from "../mocks/listening.mock";
import { listeningService } from "../services/listening.service";
import { getPermissions, MOCK_TEST_NEXT_ROUTE, MOCK_TEST_NEXT_SKILL_LABEL } from "@/features/attempts/config/modePermissions";
import { attemptsService } from "@/features/attempts/services/attempts.service";
import MockTestTransition from "@/features/attempts/components/MockTestTransition";
import { getListeningExplanation } from "@/features/quiz/mocks/explanations.mock";

const ListeningQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") ?? "practice";
  const session = searchParams.get("session") ?? "";
  const isMockSession = modeParam === "mock_test" && session === "mock";
  const perms = getPermissions(modeParam);

  const [quizData, setQuizData] = useState<{
    listeningParts: Part[];
    partDurations: number[];
    totalTime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPart, setCurrentPart] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    listeningService.getListeningQuiz().then((res) => {
      if (active) {
        setQuizData(res);
        setTimeLeft(res.totalTime);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const audioDuration = quizData ? quizData.partDurations[currentPart] : 0;

  // Timer — stops when paused (practice) or submitted
  useEffect(() => {
    if (loading || submitted || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 0) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitted, isPaused]);

  // Audio progress simulation — stops when paused
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

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading || !quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải dữ liệu bài thi nghe...</p>
        </div>
      </div>
    );
  }

  const { listeningParts, totalTime } = quizData;
  const part = listeningParts[currentPart];
  const allQuestions = listeningParts.flatMap((p) => p.questions);
  const totalQ = allQuestions.length;
  const score = submitted ? allQuestions.filter((q) => answers[q.id] === q.correct).length : 0;

  const seekAudio = (delta: number) => {
    if (!perms.canSeekListeningAudio) return;
    setAudioProgress((p) => Math.max(0, Math.min(audioDuration, p + delta)));
  };

  const reset = () => {
    setAnswers({}); setCurrentPart(0); setSubmitted(false);
    setTimeLeft(totalTime); setIsPlaying(false); setAudioProgress(0); setIsPaused(false);
  };

  const handleSubmit = async () => {
    await attemptsService.saveSkillAttempt("listening", {
      answers,
      score,
      totalQuestions: totalQ,
    });
    setSubmitted(true);
  };

  // Get global question offset for current part
  const partOffset = listeningParts.slice(0, currentPart).reduce((s, p) => s + p.questions.length, 0);

  // Mock test: show transition to next skill instead of results
  if (submitted && isMockSession) {
    return (
      <MockTestTransition
        completedSkillLabel="Listening"
        nextSkillLabel={MOCK_TEST_NEXT_SKILL_LABEL["listening"]}
        nextRoute={`${MOCK_TEST_NEXT_ROUTE["listening"]}?mode=mock_test&session=mock`}
      />
    );
  }

  // Practice: show results
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border">
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${score >= 25 ? "bg-emerald-100" : score >= 18 ? "bg-amber-100" : "bg-red-100"}`}>
              {score >= 25 ? <CheckCircle2 size={40} className="text-emerald-600" /> : <XCircle size={40} className={score >= 18 ? "text-amber-600" : "text-red-600"} />}
            </div>
            <h2 className="text-2xl font-bold text-foreground">Kết quả Listening</h2>
            <div className="text-5xl font-bold text-foreground">{score}<span className="text-2xl text-muted-foreground">/{totalQ}</span></div>
            <p className="text-muted-foreground">{score >= 25 ? "Xuất sắc!" : score >= 18 ? "Khá tốt!" : "Cần cải thiện."}</p>
            
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 my-4 text-left border-t border-b border-border py-4">
              {listeningParts.map((pt, pi) => {
                const prevQuestionsCount = listeningParts.slice(0, pi).reduce((s, p) => s + p.questions.length, 0);
                return (
                  <div key={pi} className="space-y-3 pt-2 first:pt-0">
                    <h3 className="font-bold text-sm text-foreground">{pt.title}</h3>
                    <div className="space-y-3">
                      {pt.questions.map((sq, i) => {
                        const globalIdx = prevQuestionsCount + i + 1;
                        const isCorrect = answers[sq.id] === sq.correct;
                        const userAnsStr = answers[sq.id] !== undefined ? sq.options[answers[sq.id]] : "Chưa trả lời";
                        const correctAnsStr = sq.options[sq.correct];
                        const explanation = getListeningExplanation(sq.id);

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
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Thoát
          </button>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Clock size={16} className={timeLeft < 300 ? "text-destructive" : isPaused ? "text-amber-500" : "text-muted-foreground"} />
              <span className={timeLeft < 300 ? "text-destructive" : isPaused ? "text-amber-500" : "text-foreground"}>
                {formatTime(timeLeft)}
              </span>
              {isPaused && <span className="text-xs text-amber-500 font-medium">(Tạm dừng)</span>}
            </div>

            {/* Pause button — only in practice mode */}
            {perms.canPauseTimer && (
              <Button
                size="sm"
                variant={isPaused ? "default" : "outline"}
                onClick={() => setIsPaused((p) => !p)}
                className={`gap-1.5 ${isPaused ? "gradient-primary text-primary-foreground" : ""}`}
              >
                {isPaused ? <><Play size={14} /> Tiếp tục</> : <><PauseCircle size={14} /> Tạm dừng</>}
              </Button>
            )}
          </div>

          <span className="text-sm text-muted-foreground">Đã trả lời {Object.keys(answers).length}/{totalQ}</span>
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

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Part tabs */}
        <div className="flex gap-2">
          {listeningParts.map((pt, i) => (
            <button key={i}
              onClick={() => { setCurrentPart(i); setAudioProgress(0); setIsPlaying(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i === currentPart ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              Phần {i + 1}
            </button>
          ))}
        </div>

        {/* Main content frame */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
          {/* Part info header */}
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{part.title}</h3>
                <p className="text-xs text-muted-foreground">{part.description}</p>
              </div>
              <Badge variant="outline" className="text-xs">{part.questions.length} câu</Badge>
            </div>
          </div>

          {/* Questions */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-4">
              {part.questions.map((q, i) => {
                const globalIdx = partOffset + i + 1;
                return (
                  <div key={q.id} className={`rounded-xl border-2 p-4 transition-colors ${answers[q.id] !== undefined ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      <span className="text-primary mr-1">Câu {globalIdx}.</span> {q.question}
                    </h4>
                    <RadioGroup
                      value={answers[q.id]?.toString()}
                      onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: parseInt(v) }))}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                      {q.options.map((opt, oi) => (
                        <label key={oi} className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer text-sm transition-all ${answers[q.id] === oi ? "border-primary bg-primary/10" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}>
                          <RadioGroupItem value={oi.toString()} id={`lq${q.id}-o${oi}`} />
                          <Label htmlFor={`lq${q.id}-o${oi}`} className="cursor-pointer flex-1">
                            <span className="font-medium text-muted-foreground mr-1.5">{String.fromCharCode(65 + oi)}.</span>
                            <span className="text-foreground">{opt}</span>
                          </Label>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audio player */}
          <div className="border-t border-border bg-card px-5 py-3">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground w-12">{formatTime(audioProgress)}</span>
              <div className="flex-1">
                <Progress value={(audioProgress / audioDuration) * 100} className="h-2" />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">{formatTime(audioDuration)}</span>
              <div className="flex items-center gap-1.5 ml-2">
                {/* SkipBack — hidden in mock test */}
                {perms.canSeekListeningAudio && (
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => seekAudio(-10)}>
                    <SkipBack size={14} />
                  </Button>
                )}
                <Button size="icon" className="h-10 w-10 gradient-primary text-primary-foreground"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={!perms.canReplayListeningAudio && audioProgress >= audioDuration}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                {/* SkipForward — hidden in mock test */}
                {perms.canSeekListeningAudio && (
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => seekAudio(10)}>
                    <SkipForward size={14} />
                  </Button>
                )}
              </div>
            </div>
            {!perms.canSeekListeningAudio && (
              <p className="text-xs text-amber-600 mt-1.5 text-center">
                🔒 Thi thử: không thể tua hoặc phát lại audio
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button className="gradient-primary text-primary-foreground" onClick={handleSubmit}>
            Hoàn thành
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListeningQuiz;
