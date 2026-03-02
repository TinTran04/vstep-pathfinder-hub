import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, RotateCcw, FileText, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface WritingTask {
  id: number;
  title: string;
  type: string;
  duration: string;
  minWords: number;
  recommendedWords: string;
  scoreWeight: string;
  prompt: string;
  instructions: string[];
}

const tasks: WritingTask[] = [
  {
    id: 1,
    title: "Task 1 – Writing Letter / Email",
    type: "Viết thư / Email",
    duration: "20 phút",
    minWords: 120,
    recommendedWords: "150–200 từ",
    scoreWeight: "1/3 tổng điểm (~3.3/10)",
    prompt: "You have recently moved to a new city for work. Write a letter to your friend to:\n\n• Tell him/her about your new city and your new job\n• Describe what you like and dislike about living there\n• Invite him/her to visit you\n\nWrite at least 120 words. You should use an informal style.",
    instructions: [
      "Viết một lá thư/email (thân mật hoặc trang trọng) theo yêu cầu đề bài",
      "Tối thiểu 120 từ (Khuyến nghị 150–200)",
      "Đảm bảo đầy đủ 3 ý trong đề bài",
      "Sử dụng cấu trúc thư phù hợp: lời chào, nội dung, kết thư",
    ],
  },
  {
    id: 2,
    title: "Task 2 – Writing Essay",
    type: "Viết bài luận",
    duration: "40 phút",
    minWords: 250,
    recommendedWords: "270–300 từ",
    scoreWeight: "2/3 tổng điểm (~6.7/10)",
    prompt: "Some people believe that technology has made our lives more complicated, while others think it has made life easier and more convenient.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words. Support your arguments with reasons and examples.",
    instructions: [
      "Viết một bài luận theo đề tài được cho",
      "Tối thiểu 250 từ (Khuyến nghị 270–300)",
      "Trình bày cả hai quan điểm và đưa ra ý kiến cá nhân",
      "Sử dụng cấu trúc rõ ràng: Mở bài, Thân bài, Kết luận",
      "Dùng từ nối, ví dụ minh họa và lập luận chặt chẽ",
    ],
  },
];

const TOTAL_TIME = 60 * 60; // 60 minutes

const WritingQuiz = () => {
  const navigate = useNavigate();
  const [currentTask, setCurrentTask] = useState(0);
  const [writings, setWritings] = useState<Record<number, string>>({ 1: "", 2: "" });
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 0) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const task = tasks[currentTask];
  const currentText = writings[task.id] || "";
  const wordCount = currentText.trim() ? currentText.trim().split(/\s+/).length : 0;
  const meetsMinimum = wordCount >= task.minWords;

  const reset = () => { setWritings({ 1: "", 2: "" }); setCurrentTask(0); setSubmitted(false); setTimeLeft(TOTAL_TIME); };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-emerald-100 mb-4">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Bài viết đã được nộp!</h2>
              <p className="text-muted-foreground mt-2">Trong phiên bản thực tế, bài viết sẽ được chấm bởi giáo viên hoặc AI.</p>
            </div>

            {tasks.map((t) => {
              const text = writings[t.id] || "";
              const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
              return (
                <div key={t.id} className="bg-muted/50 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{t.title}</h3>
                    <Badge variant={wc >= t.minWords ? "default" : "destructive"} className={wc >= t.minWords ? "bg-emerald-100 text-emerald-700" : ""}>
                      {wc} / {t.minWords}+ từ
                    </Badge>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border max-h-40 overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{text || <span className="text-muted-foreground italic">Chưa viết</span>}</p>
                  </div>
                </div>
              );
            })}

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
          <button onClick={() => navigate("/quiz")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Thoát</button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock size={16} className={timeLeft < 300 ? "text-destructive" : "text-muted-foreground"} />
              <span className={timeLeft < 300 ? "text-destructive" : "text-foreground"}>{formatTime(timeLeft)}</span>
            </div>
            <div className="flex gap-1">
              {tasks.map((t, i) => (
                <button key={i} onClick={() => setCurrentTask(i)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${i === currentTask ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  Task {i + 1}
                </button>
              ))}
            </div>
          </div>
          {currentTask === tasks.length - 1 ? (
            <Button className="gradient-primary text-primary-foreground" size="sm" onClick={() => setSubmitted(true)}>Hoàn thành</Button>
          ) : (
            <Button size="sm" onClick={() => setCurrentTask(1)}>Task tiếp <ArrowRight size={16} /></Button>
          )}
        </div>
        <Progress value={((currentTask + 1) / tasks.length) * 100} className="h-1" />
      </header>

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

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">⏱ {task.duration}</Badge>
                <Badge variant="outline" className="text-xs">📝 Tối thiểu {task.minWords} từ</Badge>
                <Badge variant="outline" className="text-xs">📊 {task.scoreWeight}</Badge>
              </div>

              {/* Prompt */}
              <Card className="border-border bg-muted/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3">Đề bài</h3>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{task.prompt}</div>
                </CardContent>
              </Card>

              {/* Instructions */}
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
            />

            {/* Word count bar */}
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
    </div>
  );
};

export default WritingQuiz;
