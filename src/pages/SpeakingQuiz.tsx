import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mic, MicOff, Video, VideoOff, Play, Square, RotateCcw, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpeakingPart {
  id: number;
  title: string;
  duration: string;
  prompt: string;
  tips: string[];
}

const parts: SpeakingPart[] = [
  {
    id: 1,
    title: "Part 1 – Social Interaction",
    duration: "3 phút",
    prompt: "Let's talk about your hometown.\n\n1. Where is your hometown?\n2. What do you like most about living there?\n3. Has your hometown changed much in recent years? How?",
    tips: ["Trả lời tự nhiên, không học thuộc lòng", "Mỗi câu nên trả lời 3-4 câu", "Sử dụng thì phù hợp"],
  },
  {
    id: 2,
    title: "Part 2 – Solution Discussion",
    duration: "4 phút",
    prompt: "Your university is planning to improve the campus facilities. Here are some suggestions:\n\n• Build a new library\n• Upgrade the sports center\n• Create more green spaces\n\nDiscuss the advantages and disadvantages of each suggestion and decide which improvement would benefit students the most.",
    tips: ["Thảo luận cả ưu và nhược điểm", "Đưa ra lý do cho lựa chọn của bạn", "Sử dụng từ nối logic"],
  },
  {
    id: 3,
    title: "Part 3 – Topic Development",
    duration: "5 phút",
    prompt: "Topic: The impact of social media on young people\n\nYou should:\n• Describe how social media affects young people's daily lives\n• Discuss both positive and negative effects\n• Give your opinion on how to use social media responsibly\n• Suggest what parents and schools can do",
    tips: ["Trình bày có cấu trúc: mở bài, thân bài, kết", "Đưa ra ví dụ cụ thể", "Thể hiện quan điểm cá nhân rõ ràng", "Nói ít nhất 2 phút"],
  },
];

const TOTAL_TIME = 12 * 60;

const SpeakingQuiz = () => {
  const navigate = useNavigate();
  const [currentPart, setCurrentPart] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [submitted, setSubmitted] = useState(false);

  // Camera & Mic
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Record<number, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [playingBack, setPlayingBack] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI Feedback
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<Record<number, { pronunciation: string; fluency: string; grammar: string; vocabulary: string; tips: string[] }>>({});

  // Timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 0) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Camera
  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      streamRef.current?.getVideoTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
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

  // Recording
  const startRecording = useCallback(async () => {
    if (!micOn) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: cameraOn });
      streamRef.current = stream;
      if (cameraOn && videoRef.current) videoRef.current.srcObject = stream;
      setMicOn(true);
    }
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current!, { mimeType: "audio/webm" });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setRecordings(prev => ({ ...prev, [parts[currentPart].id]: url }));
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }, [micOn, cameraOn, currentPart]);

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const reRecord = () => {
    setRecordings(prev => { const n = { ...prev }; delete n[parts[currentPart].id]; return n; });
  };

  const playback = (url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlayingBack(true);
    audio.onended = () => setPlayingBack(false);
  };

  // Mock AI feedback
  const generateAIFeedback = (partId: number) => {
    setAiLoading(true);
    setTimeout(() => {
      setAiFeedback(prev => ({
        ...prev,
        [partId]: {
          pronunciation: "7.5/10 – Phát âm khá rõ ràng, cần chú ý âm cuối /s/, /z/, /t/, /d/. Một số từ cần cải thiện: 'environment' (/ɪnˈvaɪrənmənt/), 'specifically' (/spəˈsɪfɪkli/).",
          fluency: "7.0/10 – Nói khá trôi chảy nhưng còn nhiều khoảng ngắt không cần thiết. Nên luyện nói dài hơn trước khi ngắt.",
          grammar: "7.0/10 – Sử dụng đúng các thì cơ bản. Cần cải thiện: mệnh đề quan hệ, câu điều kiện loại 2-3.",
          vocabulary: "6.5/10 – Vốn từ ở mức trung bình. Nên bổ sung thêm collocations và idioms phổ biến cho chủ đề này.",
          tips: [
            "Luyện shadowing với podcast tiếng Anh 15 phút/ngày để cải thiện phát âm và ngữ điệu",
            "Ghi âm bản thân và so sánh với native speaker",
            "Học thêm linking words: moreover, furthermore, on the other hand",
            "Thực hành trả lời câu hỏi trong 2 phút liên tục không ngắt",
            "Đọc thêm bài báo tiếng Anh để mở rộng vốn từ theo chủ đề",
          ],
        },
      }));
      setAiLoading(false);
      setShowAIFeedback(true);
    }, 2000);
  };

  const part = parts[currentPart];
  const currentRecording = recordings[part.id];

  // Cleanup
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  if (submitted || showAIFeedback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl border-border">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-emerald-100 mb-4">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{showAIFeedback ? "Kết quả đánh giá AI" : "Bài nói đã hoàn thành!"}</h2>
              {!showAIFeedback && <p className="text-muted-foreground mt-2">Nhấn "Xem đánh giá AI" để nhận phản hồi chi tiết</p>}
            </div>

            {showAIFeedback ? (
              Object.entries(aiFeedback).map(([partId, fb]) => (
                <div key={partId} className="bg-muted/50 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-foreground">Part {partId}</h3>
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
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-primary">•</span>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              parts.map(p => (
                <div key={p.id} className="bg-muted/50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{p.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{recordings[p.id] ? "✅ Đã ghi âm" : "❌ Chưa ghi âm"}</p>
                  </div>
                  {recordings[p.id] && (
                    <Button size="sm" variant="outline" onClick={() => playback(recordings[p.id])}><Play size={14} /> Nghe lại</Button>
                  )}
                </div>
              ))
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quiz")}><ArrowLeft size={16} /> Quay lại</Button>
              {!showAIFeedback ? (
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => { Object.keys(recordings).forEach(k => generateAIFeedback(Number(k))); }} disabled={aiLoading}>
                  {aiLoading ? <><Loader2 size={16} className="animate-spin" /> Đang phân tích...</> : "Xem đánh giá AI"}
                </Button>
              ) : (
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => { setShowAIFeedback(false); setSubmitted(false); setRecordings({}); setAiFeedback({}); setCurrentPart(0); setTimeLeft(TOTAL_TIME); }}>
                  <RotateCcw size={16} /> Làm lại
                </Button>
              )}
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
          <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Thoát</button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock size={16} className={timeLeft < 120 ? "text-destructive" : "text-muted-foreground"} />
              <span className={timeLeft < 120 ? "text-destructive" : "text-foreground"}>{formatTime(timeLeft)}</span>
            </div>
            <div className="flex gap-1">
              {parts.map((_, i) => (
                <button key={i} onClick={() => setCurrentPart(i)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${i === currentPart ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  Part {i + 1}
                </button>
              ))}
            </div>
          </div>
          {currentPart === parts.length - 1 ? (
            <Button className="gradient-primary text-primary-foreground" size="sm" onClick={() => setSubmitted(true)}>Hoàn thành</Button>
          ) : (
            <Button size="sm" onClick={() => setCurrentPart(p => p + 1)}>Part tiếp <ArrowRight size={16} /></Button>
          )}
        </div>
        <Progress value={((currentPart + 1) / parts.length) * 100} className="h-1" />
      </header>

      {/* Split screen */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Left: Prompt */}
        <div className="w-1/2 border-r border-border">
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
              <div>
                <h3 className="font-semibold text-foreground mb-3">Hướng dẫn</h3>
                <ul className="space-y-2">
                  {part.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary">•</span>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Camera & Recording */}
        <div className="w-1/2 flex flex-col p-6 space-y-4">
          {/* Video area */}
          <div className="relative flex-1 bg-muted rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px]">
            {cameraOn ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
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
              <Button onClick={startRecording} className="gradient-primary text-primary-foreground gap-2 rounded-full px-6">
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
