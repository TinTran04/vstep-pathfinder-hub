import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Play, Pause, RotateCcw, SkipBack, SkipForward, CheckCircle2, XCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Question {
  id: number; question: string; options: string[]; correct: number;
}
interface Part {
  title: string; type: string; readTime: string; description: string; questions: Question[];
}

const listeningParts: Part[] = [
  {
    title: "Part 1 – Short Announcements / Instructions",
    type: "Thông báo ngắn", readTime: "30 giây",
    description: "Nghe 8 thông báo hoặc hướng dẫn ngắn. Đáp án (A, B, C, D) thường ngắn gọn.",
    questions: [
      { id: 1, question: "What is the main purpose of the announcement?", options: ["To announce a holiday", "To inform about a schedule change", "To introduce a new teacher", "To cancel a class"], correct: 1 },
      { id: 2, question: "What should passengers do before boarding?", options: ["Show their ticket", "Check their luggage", "Turn off electronic devices", "Fasten seat belts"], correct: 0 },
      { id: 3, question: "Where would this announcement most likely be heard?", options: ["In a hospital", "At an airport", "In a school", "At a supermarket"], correct: 1 },
      { id: 4, question: "What time does the event start?", options: ["8:00 AM", "9:30 AM", "10:00 AM", "2:00 PM"], correct: 2 },
      { id: 5, question: "What is being advertised?", options: ["A new restaurant", "A training course", "A travel package", "A health product"], correct: 1 },
      { id: 6, question: "Who is the intended audience?", options: ["Students", "Employees", "Tourists", "Patients"], correct: 1 },
      { id: 7, question: "What does the speaker suggest?", options: ["Arriving early", "Bringing an ID", "Wearing formal clothes", "Preparing a speech"], correct: 0 },
      { id: 8, question: "What will happen next week?", options: ["A test", "A meeting", "A celebration", "A renovation"], correct: 1 },
    ],
  },
  {
    title: "Part 2 – Conversations",
    type: "Hội thoại", readTime: "20 giây trước mỗi đoạn",
    description: "Nghe 3 đoạn hội thoại giữa 2 người. Mỗi đoạn có 4 câu hỏi.",
    questions: [
      { id: 9, question: "What are the speakers mainly discussing?", options: ["A project deadline", "A job interview", "A vacation plan", "A birthday party"], correct: 0 },
      { id: 10, question: "What does the woman suggest?", options: ["Hiring more staff", "Extending the deadline", "Working overtime", "Cancelling the project"], correct: 2 },
      { id: 11, question: "Why is the man concerned?", options: ["He lost his report", "The budget is limited", "The client is unhappy", "He missed a meeting"], correct: 1 },
      { id: 12, question: "What will they probably do next?", options: ["Call the manager", "Send an email", "Schedule a meeting", "Review the documents"], correct: 2 },
      { id: 13, question: "Where does this conversation take place?", options: ["In an office", "At a restaurant", "In a library", "At a hospital"], correct: 0 },
      { id: 14, question: "What does the woman want to know?", options: ["The price", "The schedule", "The location", "The requirements"], correct: 3 },
      { id: 15, question: "How does the man feel about the proposal?", options: ["Excited", "Uncertain", "Disappointed", "Angry"], correct: 1 },
      { id: 16, question: "What problem do they need to solve?", options: ["A shipping delay", "A software bug", "A miscommunication", "A budget cut"], correct: 2 },
      { id: 17, question: "What did the woman do last week?", options: ["Attended a conference", "Visited a client", "Took an exam", "Started a new job"], correct: 0 },
      { id: 18, question: "What does the man offer to do?", options: ["Drive her home", "Help with the report", "Lend his notes", "Cook dinner"], correct: 1 },
      { id: 19, question: "When will they meet again?", options: ["Tomorrow morning", "Next Monday", "This Friday", "In two weeks"], correct: 2 },
      { id: 20, question: "What is the woman's main concern?", options: ["Quality of work", "Time management", "Cost reduction", "Team coordination"], correct: 3 },
    ],
  },
  {
    title: "Part 3 – Talks / Lectures",
    type: "Bài nói / Bài giảng", readTime: "30 giây trước mỗi bài",
    description: "Nghe 3 bài nói hoặc bài giảng mang tính học thuật. Mỗi bài có 5 câu hỏi.",
    questions: [
      { id: 21, question: "What is the main topic of the lecture?", options: ["Climate change effects", "Economic growth patterns", "Modern architecture", "Digital marketing"], correct: 0 },
      { id: 22, question: "According to the speaker, what is the primary cause?", options: ["Industrial pollution", "Deforestation", "Urbanization", "All of the above"], correct: 3 },
      { id: 23, question: "What evidence does the speaker provide?", options: ["Statistical data", "Personal experience", "Historical records", "Expert interviews"], correct: 0 },
      { id: 24, question: "What solution does the speaker propose?", options: ["Government regulation", "Public awareness campaigns", "Technological innovation", "International cooperation"], correct: 2 },
      { id: 25, question: "What is the speaker's conclusion?", options: ["The situation is hopeless", "Immediate action is needed", "More research is required", "The problem is exaggerated"], correct: 1 },
      { id: 26, question: "What field of study is this lecture about?", options: ["Biology", "Psychology", "Sociology", "Linguistics"], correct: 1 },
      { id: 27, question: "What experiment is described?", options: ["Memory recall test", "Visual perception study", "Behavioral observation", "Language acquisition analysis"], correct: 0 },
      { id: 28, question: "What were the findings of the study?", options: ["No significant difference", "Strong positive correlation", "Unexpected negative results", "Inconclusive data"], correct: 1 },
      { id: 29, question: "Who conducted the original research?", options: ["Dr. Smith", "Prof. Johnson", "Dr. Williams", "Prof. Brown"], correct: 2 },
      { id: 30, question: "What limitation does the speaker mention?", options: ["Small sample size", "Short time frame", "Cultural bias", "Equipment failure"], correct: 0 },
      { id: 31, question: "What historical period is being discussed?", options: ["The Renaissance", "The Industrial Revolution", "The Digital Age", "The Cold War"], correct: 1 },
      { id: 32, question: "How did the event impact society?", options: ["It increased inequality", "It improved living standards", "It slowed technological progress", "It had minimal effect"], correct: 1 },
      { id: 33, question: "What comparison does the speaker make?", options: ["Past vs present", "East vs West", "Theory vs practice", "Rural vs urban"], correct: 0 },
      { id: 34, question: "What does the speaker emphasize at the end?", options: ["The need for further study", "The importance of education", "The role of technology", "The value of tradition"], correct: 2 },
      { id: 35, question: "What is the speaker's tone throughout?", options: ["Formal and objective", "Casual and humorous", "Passionate and persuasive", "Critical and skeptical"], correct: 0 },
    ],
  },
];

const TOTAL_TIME = 40 * 60;

const ListeningQuiz = () => {
  const navigate = useNavigate();
  const [currentPart, setCurrentPart] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration] = useState(180);
  const audioInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 0) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (isPlaying && !submitted) {
      audioInterval.current = setInterval(() => {
        setAudioProgress((p) => {
          if (p >= audioDuration) { setIsPlaying(false); return audioDuration; }
          return p + 1;
        });
      }, 1000);
    }
    return () => { if (audioInterval.current) clearInterval(audioInterval.current); };
  }, [isPlaying, submitted, audioDuration]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const part = listeningParts[currentPart];
  const allQuestions = listeningParts.flatMap((p) => p.questions);
  const totalQ = allQuestions.length;

  const score = submitted ? allQuestions.filter((q) => answers[q.id] === q.correct).length : 0;

  const seekAudio = (delta: number) => {
    setAudioProgress((p) => Math.max(0, Math.min(audioDuration, p + delta)));
  };

  const reset = () => {
    setAnswers({}); setCurrentPart(0); setSubmitted(false);
    setTimeLeft(TOTAL_TIME); setIsPlaying(false); setAudioProgress(0);
  };

  // Get global question offset for current part
  const partOffset = listeningParts.slice(0, currentPart).reduce((s, p) => s + p.questions.length, 0);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-border">
          <CardContent className="p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${score >= 25 ? "bg-emerald-100" : score >= 18 ? "bg-amber-100" : "bg-red-100"}`}>
              {score >= 25 ? <CheckCircle2 size={40} className="text-emerald-600" /> : <XCircle size={40} className={score >= 18 ? "text-amber-600" : "text-red-600"} />}
            </div>
            <h2 className="text-2xl font-bold text-foreground">Kết quả Listening</h2>
            <div className="text-5xl font-bold text-foreground">{score}<span className="text-2xl text-muted-foreground">/{totalQ}</span></div>
            <p className="text-muted-foreground">{score >= 25 ? "Xuất sắc!" : score >= 18 ? "Khá tốt!" : "Cần cải thiện."}</p>
            {listeningParts.map((pt, pi) => (
              <div key={pi} className="text-left">
                <h3 className="font-semibold text-sm text-foreground mb-2">{pt.title}</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {pt.questions.map((sq, i) => (
                    <div key={sq.id} className={`p-2 rounded-lg text-xs ${answers[sq.id] === sq.correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                      <span className="font-medium">Câu {listeningParts.slice(0, pi).reduce((s, p) => s + p.questions.length, 0) + i + 1}: </span>
                      {answers[sq.id] === sq.correct
                        ? <span className="text-emerald-700">✓ {sq.options[sq.correct]}</span>
                        : <span className="text-red-700">✗ Đáp án: {sq.options[sq.correct]}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
          <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Thoát</button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock size={16} className={timeLeft < 300 ? "text-destructive" : "text-muted-foreground"} />
            <span className={timeLeft < 300 ? "text-destructive" : "text-foreground"}>{formatTime(timeLeft)}</span>
          </div>
          <span className="text-sm text-muted-foreground">Đã trả lời {Object.keys(answers).length}/{totalQ}</span>
        </div>
        <Progress value={(Object.keys(answers).length / totalQ) * 100} className="h-1" />
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Part tabs */}
        <div className="flex gap-2">
          {listeningParts.map((pt, i) => (
            <button key={i} onClick={() => { setCurrentPart(i); setAudioProgress(0); setIsPlaying(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i === currentPart ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              Phần {i + 1}
            </button>
          ))}
        </div>

        {/* Video-like frame */}
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

          {/* Scrollable questions area */}
          <ScrollArea className="flex-1">
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
          </ScrollArea>

          {/* Audio player at bottom */}
          <div className="border-t border-border bg-card px-5 py-3">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground w-12">{formatTime(audioProgress)}</span>
              <div className="flex-1">
                <Progress value={(audioProgress / audioDuration) * 100} className="h-2" />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">{formatTime(audioDuration)}</span>
              <div className="flex items-center gap-1.5 ml-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => seekAudio(-10)}>
                  <SkipBack size={14} />
                </Button>
                <Button size="icon" className="h-10 w-10 gradient-primary text-primary-foreground" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => seekAudio(10)}>
                  <SkipForward size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button className="gradient-primary text-primary-foreground" onClick={() => setSubmitted(true)}>
            Hoàn thành
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListeningQuiz;
