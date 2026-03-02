import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Headphones, BookOpenCheck, Pen, Mic, ArrowLeft, Clock, FileText, ChevronRight, Star, Info, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Skill = "listening" | "reading" | "writing" | "speaking";
type SkillView = "exams" | "overview";

interface QuizItem {
  id: number; title: string; description: string; duration: string;
  questions: number; difficulty: "Dễ" | "Trung bình" | "Khó"; isFree: boolean;
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
  ],
  reading: [
    { id: 6, title: "Đề thi thử Reading #1", description: "Đọc hiểu đoạn văn ngắn và xác định ý chính", duration: "45 phút", questions: 30, difficulty: "Dễ", isFree: true },
    { id: 7, title: "Đề thi thử Reading #2", description: "Đọc hiểu bài báo khoa học và phân tích", duration: "50 phút", questions: 35, difficulty: "Trung bình", isFree: true },
    { id: 8, title: "Đề thi thử Reading #3", description: "Đọc hiểu tài liệu học thuật nâng cao", duration: "55 phút", questions: 40, difficulty: "Khó", isFree: false },
  ],
  writing: [
    { id: 10, title: "Đề thi thử Writing #1", description: "Viết email + bài luận theo tình huống thực tế", duration: "60 phút", questions: 2, difficulty: "Dễ", isFree: true },
    { id: 11, title: "Đề thi thử Writing #2", description: "Viết thư trang trọng + bài luận nghị luận", duration: "60 phút", questions: 2, difficulty: "Trung bình", isFree: true },
    { id: 12, title: "Đề thi thử Writing #3", description: "Đề thi chuẩn VSTEP đầy đủ Task 1 & Task 2", duration: "60 phút", questions: 2, difficulty: "Khó", isFree: false },
  ],
  speaking: [
    { id: 13, title: "Đề thi thử Speaking #1", description: "Phỏng vấn cá nhân + trình bày chủ đề", duration: "12 phút", questions: 3, difficulty: "Dễ", isFree: true },
    { id: 14, title: "Đề thi thử Speaking #2", description: "Phỏng vấn + thảo luận chuyên sâu", duration: "12 phút", questions: 3, difficulty: "Trung bình", isFree: true },
    { id: 15, title: "Đề thi thử Speaking #3", description: "Format chuẩn VSTEP đầy đủ 3 phần", duration: "15 phút", questions: 3, difficulty: "Khó", isFree: false },
  ],
};

const overviewData: Record<Skill, { structure: { part: string; content: string; questions: string; time: string }[]; tips: string[]; scoring: string }> = {
  listening: {
    structure: [
      { part: "Part 1", content: "Short Announcements / Instructions", questions: "8 câu", time: "~10 phút" },
      { part: "Part 2", content: "Conversations (3 đoạn hội thoại)", questions: "12 câu", time: "~15 phút" },
      { part: "Part 3", content: "Talks / Lectures (3 bài nói)", questions: "15 câu", time: "~15 phút" },
    ],
    tips: ["Đọc câu hỏi trước khi nghe", "Ghi chú từ khóa quan trọng", "Chú ý từ đồng nghĩa và paraphrase", "Không dành quá nhiều thời gian cho 1 câu"],
    scoring: "Mỗi câu 0.286 điểm. Tổng 35 câu = 10 điểm.",
  },
  reading: {
    structure: [
      { part: "Passage 1", content: "Đoạn văn ngắn, chủ đề đời thường", questions: "10 câu", time: "~12 phút" },
      { part: "Passage 2", content: "Bài báo khoa học phổ thông", questions: "10 câu", time: "~15 phút" },
      { part: "Passage 3", content: "Văn bản học thuật chuyên sâu", questions: "10 câu", time: "~15 phút" },
      { part: "Passage 4", content: "Tài liệu nghiên cứu nâng cao", questions: "10 câu", time: "~18 phút" },
    ],
    tips: ["Skimming để nắm ý chính trước", "Scanning để tìm thông tin cụ thể", "Chú ý từ nối và cấu trúc đoạn văn", "Quản lý thời gian: ~15 phút/passage"],
    scoring: "Mỗi câu 0.25 điểm. Tổng 40 câu = 10 điểm.",
  },
  writing: {
    structure: [
      { part: "Task 1", content: "Viết thư/email (formal hoặc informal)", questions: "1 bài", time: "20 phút" },
      { part: "Task 2", content: "Viết bài luận nghị luận (250+ từ)", questions: "1 bài", time: "40 phút" },
    ],
    tips: ["Task 1: Đảm bảo đủ 3 ý trong đề", "Task 2: Có mở bài, thân bài (2 đoạn), kết luận", "Sử dụng từ nối và collocations", "Kiểm tra lỗi ngữ pháp trước khi nộp"],
    scoring: "Task 1: 1/3 tổng điểm (~3.3/10). Task 2: 2/3 tổng điểm (~6.7/10). Chấm theo 4 tiêu chí: Task Achievement, Coherence, Lexical, Grammar.",
  },
  speaking: {
    structure: [
      { part: "Part 1", content: "Phỏng vấn cá nhân (Social Interaction)", questions: "~8 câu", time: "3 phút" },
      { part: "Part 2", content: "Trình bày chủ đề (Individual Long Turn)", questions: "1 chủ đề", time: "4 phút" },
      { part: "Part 3", content: "Thảo luận chuyên sâu (Topic Development)", questions: "~5 câu", time: "5 phút" },
    ],
    tips: ["Part 1: Trả lời tự nhiên, đầy đủ", "Part 2: Chuẩn bị 1 phút, nói 1-2 phút", "Part 3: Đưa ra ý kiến và giải thích", "Chú ý phát âm và ngữ điệu"],
    scoring: "Chấm theo 4 tiêu chí: Pronunciation, Fluency, Vocabulary, Grammar. Mỗi tiêu chí 2.5 điểm.",
  },
};

const difficultyColor = (d: string) => {
  if (d === "Dễ") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (d === "Trung bình") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
};

const Quiz = () => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillView, setSkillView] = useState<SkillView>("exams");
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);
  const navigate = useNavigate();

  const skillRoutes: Record<Skill, string> = {
    listening: "/quiz/listening/take",
    reading: "/quiz/reading/take",
    writing: "/quiz/writing/take",
    speaking: "/quiz/speaking/take",
  };

  const handleStartQuiz = (q: QuizItem) => {
    setSelectedQuiz(q);
    setConfirmDialog(true);
  };

  const confirmStart = () => {
    if (selectedSkill) {
      navigate(skillRoutes[selectedSkill]);
    }
    setConfirmDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
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
              <button onClick={() => { setSelectedSkill(null); setSkillView("exams"); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Chọn kỹ năng luyện thi</h1>
              <p className="text-muted-foreground mt-3">Luyện tập theo từng kỹ năng với các đề thi mô phỏng chuẩn format VSTEP</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {skills.map((s) => (
                <button key={s.key} onClick={() => setSelectedSkill(s.key)}
                  className={`card-edu text-left p-8 group cursor-pointer border-2 ${s.bgColor} hover:scale-[1.02]`}>
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
          <div className="space-y-6">
            {/* Skill header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${skills.find(s => s.key === selectedSkill)!.bgColor} ${skills.find(s => s.key === selectedSkill)!.color}`}>
                  {skills.find(s => s.key === selectedSkill)!.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{skills.find(s => s.key === selectedSkill)!.label}</h1>
                  <p className="text-sm text-muted-foreground">{quizzes[selectedSkill].length} đề thi có sẵn</p>
                </div>
              </div>

              {/* Overview / Đề thi toggle */}
              <div className="flex gap-2 mt-4">
                <Button variant={skillView === "overview" ? "default" : "outline"} size="sm"
                  onClick={() => setSkillView("overview")} className={skillView === "overview" ? "gradient-primary text-primary-foreground" : ""}>
                  <Info size={16} className="mr-1" /> Overview
                </Button>
                <Button variant={skillView === "exams" ? "default" : "outline"} size="sm"
                  onClick={() => setSkillView("exams")} className={skillView === "exams" ? "gradient-primary text-primary-foreground" : ""}>
                  <FileText size={16} className="mr-1" /> Đề thi
                </Button>
              </div>
            </div>

            {skillView === "overview" ? (
              /* Overview content */
              <div className="space-y-6">
                {/* Structure table */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen size={18} className="text-primary" /> Cấu trúc bài thi
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-semibold text-foreground">Phần</th>
                            <th className="text-left py-2 px-3 font-semibold text-foreground">Nội dung</th>
                            <th className="text-left py-2 px-3 font-semibold text-foreground">Số câu</th>
                            <th className="text-left py-2 px-3 font-semibold text-foreground">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overviewData[selectedSkill].structure.map((row, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2.5 px-3 font-medium text-primary">{row.part}</td>
                              <td className="py-2.5 px-3 text-foreground">{row.content}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{row.questions}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{row.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Scoring */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-2">📊 Thang điểm</h3>
                    <p className="text-sm text-muted-foreground">{overviewData[selectedSkill].scoring}</p>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground mb-3">💡 Mẹo làm bài</h3>
                    <ul className="space-y-2">
                      {overviewData[selectedSkill].tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary font-bold">•</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Exam list */
              <div className="space-y-3">
                {quizzes[selectedSkill].map((q) => (
                  <Card key={q.id} className="border-border hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleStartQuiz(q)}>
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
                      <Button size="sm" className="gradient-primary text-primary-foreground shrink-0">Làm bài</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bắt đầu làm bài?</DialogTitle>
            <DialogDescription>
              {selectedQuiz && (
                <div className="space-y-2 mt-2">
                  <p className="font-medium text-foreground">{selectedQuiz.title}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={14} /> {selectedQuiz.duration}</span>
                    <span>{selectedQuiz.questions} câu hỏi</span>
                  </div>
                  <p className="text-sm">Bạn đã sẵn sàng làm bài chưa? Bộ đếm giờ sẽ bắt đầu ngay khi bạn ấn "Luyện tập ngay".</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Quay lại</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={confirmStart}>🚀 Luyện tập ngay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quiz;
