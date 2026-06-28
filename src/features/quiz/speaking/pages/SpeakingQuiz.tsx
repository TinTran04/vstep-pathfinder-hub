import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Mic, MicOff, Video, VideoOff, Play,
  Square, RotateCcw, CheckCircle2, Clock, Loader2, PauseCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type SpeakingFeedback, type SpeakingPart, parts as mockParts, TOTAL_TIME as MOCK_TOTAL_TIME, speakingFeedbackAITemplates } from "../mocks/speaking.mock";
import { getPermissions, MOCK_TEST_NEXT_ROUTE, MOCK_TEST_NEXT_SKILL_LABEL } from "@/features/attempts/config/modePermissions";
import { attemptsService } from "@/features/attempts/services/attempts.service";
import { attemptsApiService } from "@/features/attempts/services/attempts.api-service";
import type { SpeakingFeedbackResult } from "@/features/attempts/types";
import MockTestTransition from "@/features/attempts/components/MockTestTransition";
import { toast } from "sonner";
import { examService, type ExamDetailResponse } from "@/features/quiz/services/exam.service";
import { speakingApiService, type SpeakingResultResponse } from "../services/speaking.api-service";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";
import { cleanDescription } from "@/lib/utils";
import { useAutosave } from "@/features/attempts/hooks/useAutosave";
import { VstepMockLayout } from "@/features/quiz/components/VstepMockLayout";
import { ExitConfirmDialog } from "@/features/quiz/components/ExitConfirmDialog";

// ─── Config ──────────────────────────────────────────────────
const IS_API_MODE = import.meta.env.VITE_DATA_SOURCE === "api";

// ─── Type helpers ────────────────────────────────────────────

interface ApiFeedbackState {
  source: "api";
  submissionId: number;  // BE returns int
  score: number | null;
  feedback: string | null;
  status: string;
}

type FeedbackState = SpeakingFeedback & { source: "mock" } | ApiFeedbackState;

function toAttemptSpeakingFeedback(feedbacks: Record<number, FeedbackState>): Record<number, SpeakingFeedbackResult> {
  return Object.fromEntries(
    Object.entries(feedbacks).map(([partId, feedback]) => {
      if (feedback.source === "api") {
        const scoreText = feedback.score !== null ? `${feedback.score}/10` : "0/10";
        const tips = feedback.feedback
          ? feedback.feedback.split("\n").map((item) => item.trim()).filter(Boolean)
          : [feedback.status === "failed" ? "AI grading failed. Please try again later." : "AI is still processing this answer."];

        return [Number(partId), {
          pronunciation: scoreText,
          fluency: scoreText,
          grammar: scoreText,
          vocabulary: scoreText,
          tips,
        }];
      }

      return [Number(partId), {
        pronunciation: feedback.pronunciation,
        fluency: feedback.fluency,
        grammar: feedback.grammar,
        vocabulary: feedback.vocabulary,
        tips: feedback.tips,
      }];
    })
  );
}

// Convert ExamItem to a SpeakingPart shape
function examToPart(exam: ExamDetailResponse, index: number): SpeakingPart & { examId: number } {
  const section = exam.sections?.[0];
  const prompt = section?.passageText || section?.instruction || cleanDescription(exam.description) || exam.title;
  return {
    examId: exam.examId,
    id: index + 1,
    title: exam.title,
    duration: "5 phút",
    prompt,
    tips: [
      "Trả lời tự nhiên, có cấu trúc rõ ràng",
      "Đưa ra ví dụ cụ thể để minh họa",
      "Nói liên tục ít nhất 1–2 phút",
    ],
  };
}

// ─── Component ───────────────────────────────────────────────

const SpeakingQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") ?? "practice";
  const session = searchParams.get("session") ?? "";
  const isMockSession = modeParam === "mock_test" && session === "mock";
  const perms = getPermissions(modeParam);

  // ── Exam / quiz data ──
  const [loading, setLoading] = useState(true);
  const [noExams, setNoExams] = useState(false);
  const [partsData, setPartsData] = useState<(SpeakingPart & { examId?: number })[]>(mockParts);
  const [totalTime, setTotalTime] = useState(MOCK_TOTAL_TIME);
  const parts = useMemo(() => partsData, [partsData]);

  // ── Quiz state ──
  const [currentPart, setCurrentPart] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOCK_TOTAL_TIME);
  const [submitted, setSubmitted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mockTransition, setMockTransition] = useState(false);
  const [serverTimeRemaining, setServerTimeRemaining] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // ── Camera & Mic ──
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Recording ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Record<number, string>>({});
  const [recordingBlobs, setRecordingBlobs] = useState<Record<number, Blob>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [playingBack, setPlayingBack] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── AI Feedback ──
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<Record<number, FeedbackState>>({});
  const [pollingStatus, setPollingStatus] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [mockSpeakingExamId, setMockSpeakingExamId] = useState<number | null>(null);

  const groupId = searchParams.get("groupId") ?? "";

  // ── Load exams ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isMockSession) {
        try {
          const res = await attemptsService.getInProgressAttempt();
          if (!active) return;
          if (res) {
            setAttemptId(String(res.attemptId));

            if (res.draftStateJson) {
              try {
                const draft = JSON.parse(res.draftStateJson);
                if (draft._meta?.selectedExamIds?.speaking) {
                  setMockSpeakingExamId(draft._meta.selectedExamIds.speaking);
                }
              } catch (e) {
                console.error("Failed to parse draft state for speaking exam id", e);
              }
            }

            // Use mock parts for mock test (no need to fetch exams)
            setPartsData(mockParts);
            setTotalTime(MOCK_TOTAL_TIME);
            setTimeLeft(res.remainingSeconds > 0 ? res.remainingSeconds : MOCK_TOTAL_TIME);
          }
        } catch (err) {
          console.error("Failed to load in progress attempt", err);
        }
        if (active) setLoading(false);
        return;
      }

      if (!IS_API_MODE) {
        setPartsData(mockParts);
        setTotalTime(MOCK_TOTAL_TIME);
        setTimeLeft(MOCK_TOTAL_TIME);
        setLoading(false);
        return;
      }
      try {
        const exams = await examService.getExamsBySkill("speaking");
        if (!active) return;

        let matched = exams;
        if (groupId) {
          matched = exams.filter(e => {
            const groupMatch = e.description?.match(/group:([^;|\n]+)/);
            return groupMatch && groupMatch[1] === groupId;
          });
          if (matched.length === 0) {
            setNoExams(true);
            setLoading(false);
            return;
          }
          // Sort speaking exams by title so Part 1, 2, 3 are in order
          matched.sort((a, b) => a.title.localeCompare(b.title));
        }

        if (matched.length === 0) {
          setNoExams(true);
          setLoading(false);
          return;
        }

        const slice = matched.slice(0, 3);
        const details = await Promise.all(
          slice.map(e => examService.getExamDetail(e.id))
        );
        if (!active) return;

        const mapped = details.map((d, i) => examToPart(d, i));
        setPartsData(mapped);
        const t = slice.length * 5 * 60;
        setTotalTime(t);
        setTimeLeft(t);
      } catch (err) {
        console.error("[SpeakingQuiz] Failed to load exams", err);
        setPartsData(mockParts);
        setTotalTime(MOCK_TOTAL_TIME);
        setTimeLeft(MOCK_TOTAL_TIME);
      }
      if (active) setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [groupId]);

  // ── Block leave confirmation ────────────────────────────────
  useEffect(() => {
    if (loading || submitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show toast for practice mode when user unexpectedly leaves
      if (!isMockSession && !submitted && attemptId) {
        toast.info("Phiên luyện tập bị thoát. Tiến độ đã được lưu.");
      }
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [loading, submitted, isMockSession, attemptId]);

  // ── Server time sync (mock test) ──────────────────────────
  useEffect(() => {
    if (!isMockSession || !attemptId) return;
    const timer = setInterval(() => {
      attemptsApiService.getInProgressAttempt().then(res => {
        if (res && res.remainingSeconds >= 0) {
          setServerTimeRemaining(res.remainingSeconds);
          if (res.remainingSeconds <= 0 && !submitted) {
            setSubmitted(true);
          }
        }
      }).catch(err => console.error("Failed to fetch remaining time", err));
    }, 1000);
    return () => clearInterval(timer);
  }, [isMockSession, attemptId, submitted]);

  // ── Timer ──
  useEffect(() => {
    if (loading || submitted || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 0) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitted, isPaused]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Camera attachment ──
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  // ── Camera toggle ──
  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      streamRef.current?.getVideoTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        streamRef.current = stream;
        setCameraOn(true);
      } catch { /* permission denied */ }
    }
  }, [cameraOn, micOn]);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      streamRef.current?.getAudioTracks().forEach(t => t.stop());
      setMicOn(false);
    } else {
      try {
        if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: cameraOn });
          streamRef.current = stream;
          if (cameraOn && videoRef.current) videoRef.current.srcObject = stream;
        } else {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach(t => streamRef.current!.addTrack(t));
        }
        setMicOn(true);
      } catch { /* permission denied */ }
    }
  }, [micOn, cameraOn]);

  // ── Recording controls ──
  const startRecording = useCallback(async () => {
    if (!micOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: cameraOn });
        streamRef.current = stream;
        if (cameraOn && videoRef.current) videoRef.current.srcObject = stream;
        setMicOn(true);
      } catch {
        toast.error("Không thể truy cập microphone. Vui lòng cấp quyền truy cập micro.");
        return;
      }
    }
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current!, { mimeType: "audio/webm" });
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      const partId = parts[currentPart].id;
      setRecordings(prev => ({ ...prev, [partId]: url }));
      setRecordingBlobs(prev => ({ ...prev, [partId]: blob }));
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }, [micOn, cameraOn, currentPart, parts]);

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const reRecord = () => {
    const partId = parts[currentPart].id;
    setRecordings(prev => { const n = { ...prev }; delete n[partId]; return n; });
    setRecordingBlobs(prev => { const n = { ...prev }; delete n[partId]; return n; });
  };

  const playback = (url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlayingBack(true);
    audio.onended = () => setPlayingBack(false);
  };

  // ── API mode: upload + submit one recording ──────────────────
  const uploadAndSubmitRecording = async (
    partId: number,
    blob: Blob
  ): Promise<{ submissionId: number; audioUrl: string } | null> => {
    const part = parts.find(p => p.id === partId);
    const examId = (part as SpeakingPart & { examId?: number })?.examId;
    if (!examId) {
      toast.error(`Không tìm thấy examId cho Part ${partId}.`);
      return null;
    }
    try {
      const { submissionId, audioUrl } = await speakingApiService.uploadAndSubmit(examId, blob, "audio/webm");
      return { submissionId, audioUrl };
    } catch (err) {
      console.error(`[SpeakingQuiz] Upload/submit failed for part ${partId}`, err);
      toast.error(`Không tải được file ghi âm Part ${partId}. Vui lòng kiểm tra kết nối hoặc thử ghi âm lại.`);
      return null;
    }
  };

  // ── Mock mode: fallback upload via attemptsService ──────────
  const getOrCreateAttemptId = async (): Promise<string> => {
    let attemptId = sessionStorage.getItem("vstep_current_attempt_id");
    if (!attemptId) {
      const newAttempt = await attemptsService.startAttempt(isMockSession ? "mock_test" : "practice");
      attemptId = newAttempt.id;
      sessionStorage.setItem("vstep_current_attempt_id", attemptId);
    }
    return attemptId;
  };

  const uploadAndResolveRecordings = async (attemptId: string) => {
    const finalRecordings = { ...recordings };
    let hasUploadError = false;
    for (const partIdStr of Object.keys(recordingBlobs)) {
      const partId = Number(partIdStr);
      const blob = recordingBlobs[partId];
      if (blob) {
        try {
          const permanentUrl = await attemptsService.uploadSpeakingRecording(attemptId, partId, blob);
          finalRecordings[partId] = permanentUrl;
        } catch (err) {
          console.error(`[SpeakingQuiz] Mock upload failed part ${partId}`, err);
          hasUploadError = true;
          delete finalRecordings[partId];
        }
      }
    }
    if (hasUploadError) {
      toast.error("Tải file ghi âm Speaking thất bại. Vui lòng kiểm tra kết nối mạng!");
    }
    return finalRecordings;
  };

  // ── AI Feedback (practice mode) ──────────────────────────────
  const generateAIFeedback = async () => {
    setAiLoading(true);
    setPollingStatus("Đang gửi bài...");
    try {
      if (IS_API_MODE) {
        // Upload & submit each recorded part, then poll all
        const newFeedbacks: Record<number, FeedbackState> = {};
        for (const [partIdStr, blob] of Object.entries(recordingBlobs)) {
          const partId = Number(partIdStr);
          setPollingStatus(`Đang tải lên Part ${partId}...`);
          const result = await uploadAndSubmitRecording(partId, blob);
          if (result) {
            setPollingStatus(`Đang chờ AI chấm Part ${partId}...`);
            const graded: SpeakingResultResponse = await speakingApiService.pollUntilGraded(
              result.submissionId,
              status => setPollingStatus(`Part ${partId}: ${status}`)
            );
            newFeedbacks[partId] = {
              source: "api",
              submissionId: graded.speakingSubmissionId,
              score: graded.score,
              feedback: graded.feedback,
              status: graded.status,
            };
          } else {
            // Abort AI feedback process if upload fails
            setAiLoading(false);
            setPollingStatus("");
            return;
          }
        }
        setAiFeedback(newFeedbacks);
        setShowAIFeedback(true);
        await attemptsService.saveSkillAttempt("speaking", {
          recordings,
          speakingFeedback: toAttemptSpeakingFeedback(newFeedbacks),
        });
      } else {
        // Mock mode
        const feedback: Record<number, SpeakingFeedback> = {};
        Object.keys(recordings).forEach(key => {
          const partId = Number(key);
          feedback[partId] = speakingFeedbackAITemplates[partId] || speakingFeedbackAITemplates[1];
        });
        const mockFeedbacks: Record<number, FeedbackState> = {};
        Object.entries(feedback).forEach(([k, v]) => {
          mockFeedbacks[Number(k)] = { source: "mock", ...v };
        });
        setAiFeedback(mockFeedbacks);
        setShowAIFeedback(true);
        const attemptId = await getOrCreateAttemptId();
        const resolvedRecs = await uploadAndResolveRecordings(attemptId);
        await attemptsService.saveSkillAttempt("speaking", {
          recordings: resolvedRecs,
          speakingFeedback: toAttemptSpeakingFeedback(mockFeedbacks),
        });
      }
    } catch (e) {
      console.error("[SpeakingQuiz] AI feedback error", e);
      toast.error("Đánh giá AI thất bại. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
      setPollingStatus("");
    }
  };

  useAutosave(
    isMockSession && attemptId ? attemptId : null,
    "speaking",
    () => ({ speaking: { status: "in_progress" } }) // Cannot serialize blobs easily
  );

  const handleExitMockTest = () => {
    setShowExitDialog(true);
  };

  const getQuestionStatuses = (): Record<number, "answered" | "unanswered"> => {
    const statuses: Record<number, "answered" | "unanswered"> = {};
    parts.forEach((part) => {
      statuses[part.id] = recordings[part.id] ? "answered" : "unanswered";
    });
    return statuses;
  };

  // ── handleFinish (mock test) ──────────────────────────────────
  const handleFinish = async () => {
    if (isMockSession) {
      setAiLoading(true);
      setPollingStatus("Đang nộp bài thi...");
      try {
        const uploadedRecordings: Record<number, string> = {};
        for (const [partIdStr, blob] of Object.entries(recordingBlobs)) {
          const partId = Number(partIdStr);
          setPollingStatus(`Đang tải Part ${partId}...`);
          try {
             let permanentUrl = "";
             if (IS_API_MODE && mockSpeakingExamId) {
                const res = await speakingApiService.uploadAudio(mockSpeakingExamId, blob);
                permanentUrl = res.uploadUrl;
             } else {
                permanentUrl = await attemptsService.uploadSpeakingRecording(attemptId!, partId, blob);
             }
             uploadedRecordings[partId] = permanentUrl;
          } catch(e) {
             console.error("Failed to upload part", partId);
          }
        }

        // Format speaking answers for submission
        const speakingAnswers = Object.entries(uploadedRecordings).map(([partId, audioUrl]) => ({
          partNumber: parseInt(partId, 10),
          audioUrl,
          transcript: ""
        }));

        // Final submit!
        setPollingStatus("Đang xử lý kết quả...");
        const draftState = JSON.stringify({
          _meta: { mode: "mock_test", currentSkill: "speaking" },
          speaking: { answers: speakingAnswers }
        });
        await attemptsApiService.submitMockTest(attemptId!, draftState);
        navigate(`/attempts/${attemptId}/result`);
      } catch (e) {
        console.error("[SpeakingQuiz] handleFinish error", e);
        toast.error("Không thể nộp bài. Vui lòng thử lại.");
      } finally {
        setAiLoading(false);
        setPollingStatus("");
      }
    } else {
      // Practice mode: just save & go to submitted screen
      if (IS_API_MODE) {
        setAiLoading(true);
        try {
          for (const [partIdStr, blob] of Object.entries(recordingBlobs)) {
            const partId = Number(partIdStr);
            await uploadAndSubmitRecording(partId, blob);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setAiLoading(false);
        }
      } else {
        try {
          const attemptId = await getOrCreateAttemptId();
          await uploadAndResolveRecordings(attemptId);
        } catch (e) {
          console.error(e);
        }
      }
      setSubmitted(true);
    }
  };

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // ── Loading / empty states ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải đề thi Speaking...</p>
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
            <h2 className="text-xl font-bold text-foreground">Đề Speaking đang được cập nhật</h2>
            <p className="text-sm text-muted-foreground">
              Hiện chưa có đề thi Speaking nào được xuất bản. Vui lòng quay lại sau.
            </p>
            <Button onClick={() => navigate("/quiz")} variant="outline" className="gap-2">
              <ArrowLeft size={16} /> Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const part = parts[currentPart];
  const currentRecording = recordings[part.id];

  // ── Mock test transition ──────────────────────────────────────
  if ((submitted || mockTransition) && isMockSession) {
    return (
      <MockTestTransition
        completedSkillLabel="Speaking"
        nextSkillLabel={MOCK_TEST_NEXT_SKILL_LABEL["speaking"]}
        nextRoute={MOCK_TEST_NEXT_ROUTE["speaking"]}
      />
    );
  }

  // ── Practice result / AI feedback screen ─────────────────────
  if (submitted || showAIFeedback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl border-border">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {showAIFeedback ? "Kết quả đánh giá AI" : "Bài nói đã hoàn thành!"}
              </h2>
              {!showAIFeedback && (
                <p className="text-muted-foreground mt-2">Nhấn "Xem đánh giá AI" để nhận phản hồi chi tiết</p>
              )}
            </div>

            {/* Polling status */}
            {aiLoading && pollingStatus && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-700 dark:text-amber-400 text-center flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {pollingStatus}
                </p>
              </div>
            )}

            {showAIFeedback ? (
              Object.entries(aiFeedback).map(([partId, fb]) => (
                <div key={partId} className="bg-muted/50 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-foreground">Part {partId}</h3>
                  {fb.source === "api" ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary">
                          {fb.score !== null ? `${fb.score}/10` : "Đang xử lý..."}
                        </span>
                        {fb.status === "failed" && (
                          <div className="text-xs text-destructive bg-destructive/10 py-1 px-2 rounded-md">
                            Chấm điểm thất bại
                          </div>
                        )}
                      </div>
                      {fb.feedback && (
                        <div className="bg-card rounded-xl p-4 border border-border">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {fb.feedback}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { label: "🎤 Phát âm", value: fb.pronunciation },
                          { label: "💬 Trôi chảy", value: fb.fluency },
                          { label: "📝 Ngữ pháp", value: fb.grammar },
                          { label: "📚 Từ vựng", value: fb.vocabulary },
                        ].map(item => (
                          <div key={item.label} className="bg-card rounded-xl p-3 border border-border">
                            <p className="text-sm font-semibold text-foreground mb-1">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2">💡 Cách cải thiện:</p>
                        <ul className="space-y-1">
                          {fb.tips.map((tip, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>{tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              parts.map(p => (
                <div key={p.id} className="bg-muted/50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{p.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recordings[p.id] ? "✅ Đã ghi âm" : "❌ Chưa ghi âm"}
                    </p>
                  </div>
                  {recordings[p.id] && (
                    <Button size="sm" variant="outline" onClick={() => playback(recordings[p.id])}>
                      <Play size={14} /> Nghe lại
                    </Button>
                  )}
                </div>
              ))
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quiz")}>
                <ArrowLeft size={16} /> Quay lại
              </Button>
              {!showAIFeedback ? (
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  onClick={generateAIFeedback}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Đang phân tích...</>
                    : "Xem đánh giá AI"}
                </Button>
              ) : (
                <>
                  {Object.values(aiFeedback).some(fb => fb.source === "api" && fb.status === "failed") && (
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={generateAIFeedback}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <><Loader2 size={16} className="animate-spin" /> Đang thử lại...</> : "Thử lại chấm điểm"}
                    </Button>
                  )}
                  <Button
                    className="flex-1 gradient-primary text-primary-foreground"
                    onClick={() => {
                      setShowAIFeedback(false);
                      setSubmitted(false);
                      setRecordings({});
                      setRecordingBlobs({});
                      setAiFeedback({});
                      setCurrentPart(0);
                      setTimeLeft(totalTime);
                      setIsPaused(false);
                      setPollingStatus("");
                    }}
                  >
                    <RotateCcw size={16} /> Làm lại (Ghi âm lại)
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Speaking quiz main screen ───────────────────────────────
  if (isMockSession && attemptId) {
    const questionStatuses = getQuestionStatuses();

    return (
      <>
        <VstepMockLayout
          skillName="Speaking / Kỹ năng Nói"
          remainingSeconds={serverTimeRemaining}
          questionCount={parts.length}
          answeredCount={Object.values(questionStatuses).filter(s => s === "answered").length}
          currentQuestion={currentPart + 1}
          isLastSkill={true}
          onExit={handleExitMockTest}
          onNext={handleFinish}
          onQuestionSelect={(partNum) => setCurrentPart(partNum - 1)}
          questionStatuses={questionStatuses}
          attemptId={attemptId}
        >
          <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
          {/* Left: Prompt */}
          <div className="w-1/2 border-r border-border">
            <VocabularyContextMenu source="speaking">
              <ScrollArea className="h-[calc(100vh-64px)]">
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{part.title}</h2>
                    <Badge variant="outline" className="mt-2 text-xs">⏱ {part.duration}</Badge>
                  </div>
                  <Card className="border-border bg-muted/30">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-3">Đề bài</h3>
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{part.prompt}</div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </VocabularyContextMenu>
          </div>

          {/* Right: Camera & Recording */}
          <div className="w-1/2 flex flex-col p-6 space-y-4">
            {/* Video area */}
            <div className="relative flex-1 bg-muted rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px]">
              <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${cameraOn ? "" : "hidden"}`} />
              {!cameraOn && (
                <div className="text-center text-muted-foreground">
                  <VideoOff size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Camera đang tắt</p>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" /> Đang ghi âm...
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button size="icon" variant={cameraOn ? "default" : "outline"} onClick={toggleCamera} className="rounded-full w-12 h-12">
                {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              </Button>
              <Button size="icon" variant={micOn ? "default" : "outline"} onClick={toggleMic} className="rounded-full w-12 h-12">
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </Button>

              {!isRecording && !currentRecording && (
                <Button onClick={startRecording} className="gradient-primary text-primary-foreground gap-2 rounded-full px-6" disabled={isPaused}>
                  <Mic size={18} /> Bắt đầu ghi âm
                </Button>
              )}
              {isRecording && (
                <Button onClick={stopRecording} variant="destructive" className="gap-2 rounded-full px-6">
                  <Square size={18} /> Dừng ghi âm
                </Button>
              )}
            </div>

            {/* Playback */}
            {currentRecording && !isRecording && (
              <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">✅ Đã ghi âm Part {part.id}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => playback(currentRecording)} disabled={playingBack}>
                    <Play size={14} /> {playingBack ? "Đang phát..." : "Nghe lại"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={reRecord}><RotateCcw size={14} /> Ghi lại</Button>
                </div>
              </div>
            )}
          </div>
        </div>
        </VstepMockLayout>
        <ExitConfirmDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          onConfirm={() => {
            navigate("/quiz");
          }}
          attemptId={attemptId ? Number(attemptId) : undefined}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 h-14">
          <button onClick={() => {
            if (window.confirm("Bạn có chắc chắn muốn thoát? Bài thi đang làm sẽ bị hủy và không được lưu.")) {
              navigate("/quiz");
            }
          }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Thoát
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Clock size={16} className={timeLeft < 120 ? "text-destructive" : isPaused ? "text-amber-500" : "text-muted-foreground"} />
              <span className={timeLeft < 120 ? "text-destructive" : isPaused ? "text-amber-500" : "text-foreground"}>
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
              {parts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPart(i)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${i === currentPart ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  Part {i + 1}
                </button>
              ))}
            </div>
          </div>
          {currentPart === parts.length - 1 ? (
            <Button className="gradient-primary text-primary-foreground" size="sm" onClick={handleFinish} disabled={aiLoading}>
              {aiLoading
                ? <><Loader2 size={14} className="animate-spin" /> {pollingStatus || "Đang xử lý..."}</>
                : "Hoàn thành"}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setCurrentPart(p => p + 1)}>Part tiếp <ArrowRight size={16} /></Button>
          )}
        </div>
        <Progress value={((currentPart + 1) / parts.length) * 100} className="h-1" />
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
          <VocabularyContextMenu source="speaking">
            <ScrollArea className="h-[calc(100vh-64px)]">
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{part.title}</h2>
                  <Badge variant="outline" className="mt-2 text-xs">⏱ {part.duration}</Badge>
                </div>
                <Card className="border-border bg-muted/30">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-3">Đề bài</h3>
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{part.prompt}</div>
                  </CardContent>
                </Card>
                {!isMockSession && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Hướng dẫn</h3>
                    <ul className="space-y-2">
                      {part.tips.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          </VocabularyContextMenu>
        </div>

        {/* Right: Camera & Recording */}
        <div className="w-1/2 flex flex-col p-6 space-y-4">
          {/* Video area */}
          <div className="relative flex-1 bg-muted rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px]">
            <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${cameraOn ? "" : "hidden"}`} />
            {!cameraOn && (
              <div className="text-center text-muted-foreground">
                <VideoOff size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera đang tắt</p>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" /> Đang ghi âm...
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button size="icon" variant={cameraOn ? "default" : "outline"} onClick={toggleCamera} className="rounded-full w-12 h-12">
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </Button>
            <Button size="icon" variant={micOn ? "default" : "outline"} onClick={toggleMic} className="rounded-full w-12 h-12">
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </Button>

            {!isRecording && !currentRecording && (
              <Button onClick={startRecording} className="gradient-primary text-primary-foreground gap-2 rounded-full px-6" disabled={isPaused}>
                <Mic size={18} /> Bắt đầu ghi âm
              </Button>
            )}
            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" className="gap-2 rounded-full px-6">
                <Square size={18} /> Dừng ghi âm
              </Button>
            )}
          </div>

          {/* Playback */}
          {currentRecording && !isRecording && (
            <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">✅ Đã ghi âm Part {part.id}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => playback(currentRecording)} disabled={playingBack}>
                  <Play size={14} /> {playingBack ? "Đang phát..." : "Nghe lại"}
                </Button>
                <Button size="sm" variant="outline" onClick={reRecord}><RotateCcw size={14} /> Ghi lại</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingQuiz;
