import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Headphones, BookOpenCheck, Pen, Mic, ArrowLeft, Clock, FileText, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Skill = "listening" | "reading" | "writing" | "speaking";

interface QuizItem {
  id: number;
  title: string;
  description: string;
  duration: string;
  questions: number;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  isFree: boolean;
}

const skills: { key: Skill; label: string; icon: React.ReactNode; color: string; bgColor: string; desc: string }[] = [
  { key: "listening", label: "Listening", icon: <Headphones size={28} />, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", desc: "Nghe hiểu hội thoại, bài giảng và thông báo" },
  { key: "reading", label: "Reading", icon: <BookOpenCheck size={28} />, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", desc: "Đọc hiểu đoạn văn, bài báo và tài liệu" },
  { key: "writing", label: "Writing", icon: <Pen size={28} />, color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", desc: "Viết email, thư và bài luận" },
  { key: "speaking", label: "Speaking", icon: <Mic size={28} />, color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200", desc: "Phỏng vấn, thảo luận và trình bày" },
];

const quizzes: Record<Skill, QuizItem[]> = {
  listening: [
    { id: 1, title: "Đề thi thử Listening #1", description: "Nghe hiểu hội thoại ngắn và trả lời câu hỏi", duration: "30 phút", questions: 25, difficulty: "Dễ", isFree: true },
    { id: 2, title: "Đề thi thử Listening #2", description: "Nghe hiểu bài giảng và ghi chú thông tin", duration: "35 phút", questions: 30, difficulty: "Trung bình", isFree: true },
    { id: 3, title: "Đề thi thử Listening #3", description: "Nghe hiểu thông báo và hội thoại phức tạp", duration: "40 phút", questions: 35, difficulty: "Khó", isFree: false },
    { id: 4, title: "Luyện Part 1 - Hội thoại ngắn", description: "Tập trung vào dạng câu hỏi hội thoại ngắn", duration: "15 phút", questions: 10, difficulty: "Dễ", isFree: true },
    { id: 5, title: "Luyện Part 2 - Bài giảng", description: "Tập trung vào dạng bài giảng dài", duration: "20 phút", questions: 15, difficulty: "Trung bình", isFree: false },
  ],
  reading: [
    { id: 6, title: "Đề thi thử Reading #1", description: "Đọc hiểu đoạn văn ngắn và xác định ý chính", duration: "45 phút", questions: 30, difficulty: "Dễ", isFree: true },
    { id: 7, title: "Đề thi thử Reading #2", description: "Đọc hiểu bài báo khoa học và phân tích", duration: "50 phút", questions: 35, difficulty: "Trung bình", isFree: true },
    { id: 8, title: "Đề thi thử Reading #3", description: "Đọc hiểu tài liệu học thuật nâng cao", duration: "55 phút", questions: 40, difficulty: "Khó", isFree: false },
    { id: 9, title: "Luyện kỹ năng Scanning", description: "Tìm thông tin cụ thể trong đoạn văn", duration: "20 phút", questions: 15, difficulty: "Dễ", isFree: true },
  ],
  writing: [
    { id: 10, title: "Task 1 - Viết Email", description: "Luyện viết email theo các tình huống thực tế", duration: "30 phút", questions: 2, difficulty: "Dễ", isFree: true },
    { id: 11, title: "Task 2 - Viết Luận", description: "Viết bài luận 250 từ theo chủ đề cho sẵn", duration: "45 phút", questions: 1, difficulty: "Trung bình", isFree: true },
    { id: 12, title: "Đề thi thử Writing đầy đủ", description: "Làm cả Task 1 và Task 2 trong thời gian chuẩn", duration: "60 phút", questions: 3, difficulty: "Khó", isFree: false },
  ],
  speaking: [
    { id: 13, title: "Part 1 - Phỏng vấn cá nhân", description: "Trả lời câu hỏi về bản thân và cuộc sống", duration: "5 phút", questions: 8, difficulty: "Dễ", isFree: true },
    { id: 14, title: "Part 2 - Trình bày chủ đề", description: "Trình bày 1-2 phút về chủ đề cho sẵn", duration: "10 phút", questions: 3, difficulty: "Trung bình", isFree: true },
    { id: 15, title: "Part 3 - Thảo luận", description: "Thảo luận chuyên sâu về một vấn đề xã hội", duration: "10 phút", questions: 5, difficulty: "Khó", isFree: false },
    { id: 16, title: "Đề thi thử Speaking đầy đủ", description: "Hoàn thành cả 3 phần trong format chuẩn VSTEP", duration: "15 phút", questions: 16, difficulty: "Khó", isFree: false },
  ],
};

const difficultyColor = (d: string) => {
  if (d === "Dễ") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (d === "Trung bình") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
};

const Quiz = () => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">V</span>
              </div>
              <span className="font-bold text-lg text-foreground">VSTEP<span className="text-gradient">Pro</span></span>
            </Link>
            {selectedSkill && (
              <button onClick={() => setSelectedSkill(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Chọn kỹ năng
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>Đăng nhập</Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        {!selectedSkill ? (
          /* Skill selection */
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Chọn kỹ năng luyện thi</h1>
              <p className="text-muted-foreground mt-3">Luyện tập theo từng kỹ năng với các đề thi mô phỏng chuẩn format VSTEP</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {skills.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSkill(s.key)}
                  className={`card-edu text-left p-8 group cursor-pointer border-2 ${s.bgColor} hover:scale-[1.02]`}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-card flex items-center justify-center ${s.color} mb-4 group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    Xem đề thi <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Quiz list */
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${skills.find((s) => s.key === selectedSkill)!.bgColor} ${skills.find((s) => s.key === selectedSkill)!.color}`}>
                  {skills.find((s) => s.key === selectedSkill)!.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{skills.find((s) => s.key === selectedSkill)!.label}</h1>
                  <p className="text-sm text-muted-foreground">{quizzes[selectedSkill].length} đề thi có sẵn</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {quizzes[selectedSkill].map((q) => (
                <Card key={q.id} className="border-border hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/quiz/${selectedSkill}/${q.id}`)}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-foreground">{q.title}</h3>
                        {q.isFree && <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Miễn phí</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{q.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={12} /> {q.duration}</span>
                        <span>{q.questions} câu hỏi</span>
                        <Badge variant="outline" className={`text-xs ${difficultyColor(q.difficulty)}`}>{q.difficulty}</Badge>
                      </div>
                    </div>
                    <Button size="sm" className="gradient-primary text-primary-foreground shrink-0">
                      Làm bài
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
