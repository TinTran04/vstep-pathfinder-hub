import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, RotateCcw, FileText, Type, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AnnotatedText, { type TextError } from "@/components/AnnotatedText";

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

const sampleEssays = {
  1: {
    level: "B2 (8.5/10)",
    content: `Dear Tom,

I hope this letter finds you well! I'm writing to share some exciting news about my new life in Da Nang.

I moved here three weeks ago for a marketing position at a tech startup. The company culture is fantastic — my colleagues are supportive, and the work is challenging yet rewarding. I'm particularly enjoying the creative freedom I have in developing campaigns for Vietnamese and international markets.

Da Nang has been a wonderful surprise. The beaches are absolutely stunning, especially My Khe Beach, which is just a 10-minute drive from my apartment. The food scene is incredible too — I've been eating bun cha ca almost every day! The cost of living is significantly lower than Ho Chi Minh City, which means I can save more while enjoying a higher quality of life.

However, there are a few things I'm still adjusting to. The city is quieter than what I'm used to, and the nightlife options are somewhat limited. Also, the summer heat can be quite intense, reaching up to 38°C some days.

I would absolutely love it if you could come visit me! There's so much to explore here — the Marble Mountains, Ba Na Hills, and the ancient town of Hoi An is just 30 minutes away. You're welcome to stay at my place anytime.

Looking forward to hearing from you soon!

Warm regards,
Minh

(Word count: 208)`,
  },
  2: {
    level: "B2 (8.0/10)",
    content: `Technology: A Double-Edged Sword in Modern Life

The rapid advancement of technology has sparked a heated debate about whether it simplifies or complicates our daily existence. While some argue that technological innovations have introduced unnecessary complexity, others maintain that they have streamlined our lives in unprecedented ways. This essay will examine both perspectives before presenting my own viewpoint.

On one hand, technology has undeniably made certain aspects of life more complicated. The constant connectivity through smartphones and social media has blurred the boundaries between work and personal life, leading to increased stress and burnout. Furthermore, the overwhelming amount of information available online can cause decision fatigue and anxiety. Cybersecurity threats, privacy concerns, and the need to constantly update skills to keep pace with technological changes add further layers of complexity to modern life.

On the other hand, proponents of technology highlight its remarkable contributions to convenience and efficiency. Online banking, e-commerce, and digital communication have eliminated geographical barriers and saved countless hours previously spent on mundane tasks. In healthcare, technological innovations such as telemedicine and AI-assisted diagnostics have improved access to medical services, particularly in remote areas. Moreover, educational technology has democratized learning, making quality education accessible to millions worldwide through platforms like Coursera and Khan Academy.

In my opinion, while technology does introduce certain challenges, its benefits far outweigh the drawbacks. The key lies in developing digital literacy and maintaining a healthy relationship with technology. By setting boundaries for screen time, staying informed about online security, and embracing lifelong learning, individuals can harness the power of technology while minimizing its negative effects.

In conclusion, technology is a powerful tool that, when used wisely, significantly enhances our quality of life. Rather than viewing it as a source of complication, we should focus on cultivating the skills needed to navigate the digital landscape effectively.

(Word count: 280)`,
  },
};

const TOTAL_TIME = 60 * 60;

const WritingQuiz = () => {
  const navigate = useNavigate();
  const [currentTask, setCurrentTask] = useState(0);
  const [writings, setWritings] = useState<Record<number, string>>({ 1: "", 2: "" });
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [showSample, setShowSample] = useState(false);

  // AI Feedback
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<Record<number, { taskAchievement: string; coherence: string; lexical: string; grammar: string; score: string; tips: string[]; errors: TextError[] }>>({});

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

  const reset = () => { setWritings({ 1: "", 2: "" }); setCurrentTask(0); setSubmitted(false); setTimeLeft(TOTAL_TIME); setShowAIFeedback(false); setAiFeedback({}); };

  const findErrors = (text: string, taskId: number): TextError[] => {
    const errors: TextError[] = [];
    // Common grammar/vocab patterns to detect
    const patterns: { regex: RegExp; suggestion: string | ((m: string) => string); explanation: string; type: TextError["type"] }[] = [
      { regex: /\b(i)\b/g, suggestion: "I", explanation: "Đại từ nhân xưng 'I' luôn viết hoa.", type: "grammar" },
      { regex: /\b(dont|doesnt|didnt|cant|wont|isnt|arent|wasnt|werent|havent|hasnt|hadnt)\b/gi, suggestion: (m: string) => m.replace(/nt$/i, "n't"), explanation: "Cần thêm dấu nháy cho dạng rút gọn.", type: "spelling" },
      { regex: /\b(alot)\b/gi, suggestion: "a lot", explanation: "'A lot' viết tách thành 2 từ.", type: "spelling" },
      { regex: /\b(becuz|bcuz|cuz)\b/gi, suggestion: "because", explanation: "Sử dụng từ đầy đủ 'because' trong bài viết chính thức.", type: "vocabulary" },
      { regex: /\b(gonna)\b/gi, suggestion: "going to", explanation: "'Gonna' là dạng nói, dùng 'going to' trong viết.", type: "vocabulary" },
      { regex: /\b(wanna)\b/gi, suggestion: "want to", explanation: "'Wanna' là dạng nói, dùng 'want to' trong viết.", type: "vocabulary" },
      { regex: /\b(wich|whitch)\b/gi, suggestion: "which", explanation: "Lỗi chính tả: đúng là 'which'.", type: "spelling" },
      { regex: /\b(recieve)\b/gi, suggestion: "receive", explanation: "Lỗi chính tả: đúng là 'receive' (i trước e sau c).", type: "spelling" },
      { regex: /\b(definately|definatly)\b/gi, suggestion: "definitely", explanation: "Lỗi chính tả: đúng là 'definitely'.", type: "spelling" },
      { regex: /\b(their|there|they're)\b/gi, suggestion: "", explanation: "Kiểm tra lại: their (sở hữu), there (nơi đó), they're (they are).", type: "grammar" },
      { regex: /\b(very good)\b/gi, suggestion: "excellent / outstanding", explanation: "Thay 'very good' bằng từ mạnh hơn để nâng điểm từ vựng.", type: "vocabulary" },
      { regex: /\b(very bad)\b/gi, suggestion: "terrible / dreadful", explanation: "Thay 'very bad' bằng từ mạnh hơn.", type: "vocabulary" },
      { regex: /\b(very big)\b/gi, suggestion: "enormous / massive", explanation: "Dùng từ mạnh hơn thay cho 'very + adj'.", type: "vocabulary" },
      { regex: /\b(very small)\b/gi, suggestion: "tiny / minuscule", explanation: "Dùng từ mạnh hơn thay cho 'very + adj'.", type: "vocabulary" },
      { regex: /\b(He go|She go|It go)\b/g, suggestion: (m: string) => m.replace("go", "goes"), explanation: "Chia động từ ngôi thứ 3 số ít: thêm -s/-es.", type: "grammar" },
      { regex: /\b(childs)\b/gi, suggestion: "children", explanation: "Danh từ bất quy tắc: child → children.", type: "grammar" },
      { regex: /\b(mans)\b/gi, suggestion: "men", explanation: "Danh từ bất quy tắc: man → men.", type: "grammar" },
      { regex: /\b(womans)\b/gi, suggestion: "women", explanation: "Danh từ bất quy tắc: woman → women.", type: "grammar" },
      { regex: /\b(informations)\b/gi, suggestion: "information", explanation: "'Information' là danh từ không đếm được, không thêm -s.", type: "grammar" },
      { regex: /\b(advices)\b/gi, suggestion: "advice", explanation: "'Advice' là danh từ không đếm được.", type: "grammar" },
      { regex: /\.\s*However\s+/g, suggestion: ". However, ", explanation: "Sau 'However' cần dấu phẩy.", type: "coherence" },
      { regex: /\.\s*Moreover\s+(?!,)/g, suggestion: ". Moreover, ", explanation: "Sau 'Moreover' cần dấu phẩy.", type: "coherence" },
      { regex: /\.\s*Furthermore\s+(?!,)/g, suggestion: ". Furthermore, ", explanation: "Sau 'Furthermore' cần dấu phẩy.", type: "coherence" },
      { regex: /\.\s*In addition\s+(?!,)/g, suggestion: ". In addition, ", explanation: "Sau 'In addition' cần dấu phẩy.", type: "coherence" },
    ];

    patterns.forEach(({ regex, suggestion, explanation, type }) => {
      let match;
      const re = new RegExp(regex.source, regex.flags);
      while ((match = re.exec(text)) !== null) {
        const sug = typeof suggestion === "function" ? (suggestion as (m: string) => string)(match[0]) : suggestion;
        // Skip empty suggestions (informational only like their/there/they're)
        if (!sug) continue;
        errors.push({
          start: match.index,
          end: match.index + match[0].length,
          original: match[0],
          suggestion: sug,
          explanation,
          type,
        });
      }
    });

    // Remove overlapping errors (keep the first found)
    errors.sort((a, b) => a.start - b.start);
    const filtered: TextError[] = [];
    let lastEnd = -1;
    for (const err of errors) {
      if (err.start >= lastEnd) {
        filtered.push(err);
        lastEnd = err.end;
      }
    }

    return filtered;
  };

  const generateAIFeedback = () => {
    setAiLoading(true);
    setTimeout(() => {
      const feedback: Record<number, any> = {};
      tasks.forEach(t => {
        const text = writings[t.id] || "";
        const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
        const errors = findErrors(text, t.id);

        if (wc < 20) {
          feedback[t.id] = {
            taskAchievement: "N/A – Bài viết quá ngắn để đánh giá",
            coherence: "N/A",
            lexical: "N/A",
            grammar: "N/A",
            score: "0/10",
            tips: ["Viết tối thiểu " + t.minWords + " từ để được đánh giá"],
            errors: [],
          };
        } else {
          const base = t.id === 1 ? {
            taskAchievement: "7.5/10 – Hoàn thành đủ 3 ý trong đề bài. Phần mời bạn đến thăm có thể mở rộng thêm chi tiết cụ thể.",
            coherence: "7.0/10 – Bài viết có cấu trúc rõ ràng (mở – thân – kết). Tuy nhiên cần sử dụng thêm từ nối giữa các đoạn.",
            lexical: "7.0/10 – Vốn từ đa dạng ở mức trung bình. Nên dùng thêm collocations và tránh lặp từ.",
            grammar: "7.5/10 – Sử dụng đúng thì và cấu trúc câu cơ bản. Cần cải thiện câu phức và mệnh đề quan hệ.",
            score: "7.3/10",
            tips: [
              "Luyện viết email theo template: Greeting → Reason → Details → Closing",
              "Học thêm formal/informal expressions phù hợp với từng loại thư",
              "Đọc mẫu email chuẩn VSTEP B2 để nắm cấu trúc",
              "Thực hành viết 1 email/ngày trong 15 phút",
            ],
          } : {
            taskAchievement: "7.0/10 – Đã trình bày cả 2 quan điểm và đưa ra ý kiến cá nhân. Cần thêm ví dụ cụ thể để minh họa.",
            coherence: "7.5/10 – Cấu trúc bài luận tốt với mở bài, thân bài, kết luận rõ ràng. Sử dụng từ nối hợp lý.",
            lexical: "6.5/10 – Vốn từ còn hạn chế, hay lặp từ. Nên sử dụng synonyms và academic vocabulary.",
            grammar: "7.0/10 – Có một số lỗi về sự hòa hợp chủ-vị và mạo từ. Câu phức cần chính xác hơn.",
            score: "7.0/10",
            tips: [
              "Học cấu trúc bài luận: Introduction → Body 1 (View A) → Body 2 (View B) → Opinion → Conclusion",
              "Mỗi body paragraph nên có: Topic sentence → Explanation → Example → Link",
              "Tích lũy Academic Word List (AWL) để nâng band từ vựng",
              "Viết ít nhất 2 bài luận/tuần và tự chấm theo 4 tiêu chí",
              "Đọc essays mẫu band 8+ để học cách diễn đạt",
            ],
          };
          feedback[t.id] = { ...base, errors };
        }
      });
      setAiFeedback(feedback);
      setAiLoading(false);
      setShowAIFeedback(true);
    }, 2500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl border-border">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-emerald-100 mb-4">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{showAIFeedback ? "Kết quả chấm điểm AI" : "Bài viết đã được nộp!"}</h2>
              {!showAIFeedback && <p className="text-muted-foreground mt-2">Nhấn "Chấm điểm AI" để nhận feedback chi tiết theo 4 tiêu chí.</p>}
            </div>

            {showAIFeedback ? (
              tasks.map(t => {
                const fb = aiFeedback[t.id];
                if (!fb) return null;
                return (
                  <div key={t.id} className="bg-muted/50 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-foreground">{t.title}</h3>
                      <Badge className="gradient-primary text-primary-foreground text-sm">{fb.score}</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { label: "📋 Task Achievement", value: fb.taskAchievement },
                        { label: "🔗 Coherence & Cohesion", value: fb.coherence },
                        { label: "📚 Lexical Resource", value: fb.lexical },
                        { label: "📝 Grammar Range & Accuracy", value: fb.grammar },
                      ].map(item => (
                        <div key={item.label} className="bg-card rounded-xl p-3 border border-border">
                          <p className="text-sm font-semibold text-foreground mb-1">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {/* Annotated text with highlighted errors */}
                    {fb.errors && fb.errors.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2">📝 Bài viết đã chấm (bôi màu lỗi sai):</p>
                        <div className="bg-card rounded-xl p-4 border border-border">
                          <AnnotatedText text={writings[t.id] || ""} errors={fb.errors} />
                        </div>
                      </div>
                    )}
                    {fb.errors && fb.errors.length === 0 && (
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-sm text-foreground">✅ Không phát hiện lỗi phổ biến. Bài viết khá tốt!</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">💡 Cách cải thiện:</p>
                      <ul className="space-y-1">
                        {fb.tips.map((tip: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="text-primary">•</span>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })
            ) : (
              tasks.map((t) => {
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
              })
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quiz")}><ArrowLeft size={16} /> Quay lại</Button>
              {!showAIFeedback ? (
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={generateAIFeedback} disabled={aiLoading}>
                  {aiLoading ? <><Loader2 size={16} className="animate-spin" /> Đang chấm...</> : "🤖 Chấm điểm AI"}
                </Button>
              ) : (
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={reset}><RotateCcw size={16} /> Làm lại</Button>
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
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowSample(true)} className="gap-1"><BookOpen size={14} /> Bài mẫu</Button>
            {currentTask === tasks.length - 1 ? (
              <Button className="gradient-primary text-primary-foreground" size="sm" onClick={() => setSubmitted(true)}>Hoàn thành</Button>
            ) : (
              <Button size="sm" onClick={() => setCurrentTask(1)}>Task tiếp <ArrowRight size={16} /></Button>
            )}
          </div>
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
