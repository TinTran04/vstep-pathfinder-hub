import { Headphones, BookOpen, PenTool, Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const skills = [
  {
    icon: Headphones,
    name: "Listening",
    color: "bg-blue-500/10 text-blue-600",
    desc: "Luyện nghe theo đúng format VSTEP với các dạng bài điền từ, chọn đáp án, nghe hiểu chi tiết.",
  },
  {
    icon: BookOpen,
    name: "Reading",
    color: "bg-emerald-500/10 text-emerald-600",
    desc: "Đọc hiểu đa dạng chủ đề với bài tập phân tích, tìm ý chính, đọc chi tiết và suy luận.",
  },
  {
    icon: PenTool,
    name: "Writing",
    color: "bg-amber-500/10 text-amber-600",
    desc: "Luyện viết email, thư trang trọng và bài luận theo rubric chấm điểm chuẩn VSTEP.",
  },
  {
    icon: Mic,
    name: "Speaking",
    color: "bg-rose-500/10 text-rose-600",
    desc: "Thực hành nói với các chủ đề quen thuộc, trả lời câu hỏi và trình bày quan điểm.",
  },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">4 Kỹ năng</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Luyện đủ 4 kỹ năng theo chuẩn VSTEP
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Mỗi kỹ năng được thiết kế bài bản với nội dung sát đề thi thực tế.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((s) => (
            <div key={s.name} className="card-edu group">
              <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center mb-4`}>
                <s.icon size={26} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{s.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
              <Button variant="ghost" size="sm" className="text-primary font-medium p-0 h-auto hover:bg-transparent group-hover:gap-2 transition-all">
                Khám phá ngay <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
