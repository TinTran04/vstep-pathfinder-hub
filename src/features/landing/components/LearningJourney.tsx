import { UserCircle2, BookOpenCheck, Trophy, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: UserCircle2,
    step: "01",
    title: "Đăng ký & Đăng nhập",
    desc: "Tạo tài khoản miễn phí trong vài giây để bắt đầu trải nghiệm toàn bộ tính năng luyện thi VSTEP.",
  },
  {
    icon: BookOpenCheck,
    step: "02",
    title: "Luyện tập từng kỹ năng",
    desc: "Chọn Listening, Reading, Writing hoặc Speaking. Làm bài theo đề thực tế, có thể tạm dừng và xem đáp án chi tiết.",
  },
  {
    icon: Trophy,
    step: "03",
    title: "Thi thử Full Test VSTEP",
    desc: "Làm bài đủ 4 kỹ năng theo trình tự thực tế. Không tạm dừng, tính giờ chuẩn — giống kỳ thi thật nhất có thể.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Xem kết quả & điểm AI",
    desc: "Nhận điểm số ngay sau khi nộp bài. Writing & Speaking được chấm bởi AI, kèm nhận xét chi tiết để cải thiện.",
  },
];

const LearningJourney = () => {
  return (
    <section id="journey" className="section-padding section-alt">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Cách hoạt động</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Bắt đầu luyện thi chỉ trong 4 bước
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Đơn giản, trực quan — không cần cài đặt hay cấu hình phức tạp.
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
