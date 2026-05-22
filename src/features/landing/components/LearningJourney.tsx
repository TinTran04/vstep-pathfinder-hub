import { Target, BookOpen, FileText, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Target,
    step: "01",
    title: "Chọn mục tiêu VSTEP",
    desc: "Xác định level mục tiêu (B1 hoặc B2) và thời gian ôn luyện phù hợp với bạn.",
  },
  {
    icon: BookOpen,
    step: "02",
    title: "Học theo kỹ năng",
    desc: "Luyện từng kỹ năng Listening, Reading, Writing, Speaking với bài tập từ cơ bản đến nâng cao.",
  },
  {
    icon: FileText,
    step: "03",
    title: "Luyện đề thực tế",
    desc: "Làm đề thi mô phỏng hoàn chỉnh, có tính giờ và chấm điểm tự động theo rubric chuẩn.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Cải thiện liên tục",
    desc: "Xem phân tích chi tiết, nhận gợi ý bài học phù hợp và theo dõi tiến bộ qua từng tuần.",
  },
];

const LearningJourney = () => {
  return (
    <section id="journey" className="section-padding section-alt">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Lộ trình học</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Quy trình học VSTEP hiệu quả
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            4 bước đơn giản giúp bạn đi từ zero đến đạt chuẩn đầu ra.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-border" />
              )}
              <div className="card-edu text-center relative">
                <span className="text-5xl font-extrabold text-primary/10 absolute top-4 right-4">{s.step}</span>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon size={26} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LearningJourney;
