import { BookOpen, Headphones, PenTool, Mic, Target, Award, TrendingUp, Layers } from "lucide-react";

const branches = [
  {
    title: "VSTEP là gì?",
    icon: BookOpen,
    description: "Vietnamese Standardized Test of English Proficiency – Bài thi đánh giá năng lực tiếng Anh chuẩn quốc gia, được Bộ GD&ĐT công nhận.",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "4 Kỹ năng thi",
    icon: Layers,
    items: [
      { icon: Headphones, label: "Listening", desc: "Nghe hiểu – 3 phần, 35 câu, 40 phút" },
      { icon: BookOpen, label: "Reading", desc: "Đọc hiểu – 4 phần, 40 câu, 60 phút" },
      { icon: PenTool, label: "Writing", desc: "Viết – 2 phần, viết thư & bài luận, 60 phút" },
      { icon: Mic, label: "Speaking", desc: "Nói – 3 phần, phỏng vấn trực tiếp, 12 phút" },
    ],
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Cấu trúc bài thi",
    icon: Target,
    description: "Tổng thời gian: ~172 phút. Điểm đánh giá theo khung năng lực 6 bậc (tương đương CEFR A1–C1). Kết quả có giá trị 2 năm.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    title: "Lộ trình đạt B1–C1",
    icon: TrendingUp,
    steps: [
      { level: "B1", desc: "Nền tảng vững – giao tiếp cơ bản", duration: "2–3 tháng" },
      { level: "B2", desc: "Chuẩn đầu ra đại học", duration: "3–4 tháng" },
      { level: "C1", desc: "Thành thạo nâng cao", duration: "4–6 tháng" },
    ],
    color: "bg-emerald-100 text-emerald-700",
  },
];

const VstepOverview = () => {
  return (
    <section id="vstep-overview" className="section-padding section-alt">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Award size={16} /> Tổng quan kỳ thi
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Hiểu rõ <span className="text-gradient">kỳ thi VSTEP</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Nắm vững cấu trúc, format và lộ trình ôn thi để chinh phục chứng chỉ VSTEP một cách hiệu quả nhất.
          </p>
        </div>

        {/* Mindmap-style grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* VSTEP là gì */}
          <div className="card-edu flex gap-4">
            <div className={`w-12 h-12 rounded-xl ${branches[0].color} flex items-center justify-center shrink-0`}>
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">{branches[0].title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{branches[0].description}</p>
            </div>
          </div>

          {/* Cấu trúc bài thi */}
          <div className="card-edu flex gap-4">
            <div className={`w-12 h-12 rounded-xl ${branches[2].color} flex items-center justify-center shrink-0`}>
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">{branches[2].title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{branches[2].description}</p>
            </div>
          </div>

          {/* 4 Kỹ năng */}
          <div className="card-edu md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${branches[1].color} flex items-center justify-center`}>
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{branches[1].title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {branches[1].items!.map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon size={16} className="text-primary" />
                    <span className="font-semibold text-sm text-foreground">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lộ trình */}
          <div className="card-edu md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${branches[3].color} flex items-center justify-center`}>
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{branches[3].title}</h3>
            </div>
            <div className="space-y-3">
              {branches[3].steps!.map((step, i) => (
                <div key={step.level} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? "bg-primary/15 text-primary" : i === 1 ? "bg-accent/15 text-accent" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {step.level}
                    </div>
                    {i < 2 && <div className="w-0.5 h-4 bg-border mt-1" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{step.desc}</p>
                    <p className="text-xs text-muted-foreground">Thời gian ước tính: {step.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VstepOverview;
