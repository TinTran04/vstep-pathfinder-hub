import { Target, Layers, Route, BarChart3 } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "Đúng cấu trúc đề VSTEP",
    desc: "Bài học và đề thi được thiết kế sát format VSTEP chính thức, giúp bạn quen dạng đề ngay từ đầu.",
  },
  {
    icon: Layers,
    title: "Luyện 4 kỹ năng đầy đủ",
    desc: "Listening, Reading, Writing, Speaking — luyện toàn diện với bài tập thực tế cho từng kỹ năng.",
  },
  {
    icon: Route,
    title: "Lộ trình tự học rõ ràng",
    desc: "Học theo lộ trình được thiết kế khoa học, phù hợp với trình độ và mục tiêu của bạn.",
  },
  {
    icon: BarChart3,
    title: "Theo dõi tiến độ dễ dàng",
    desc: "Dashboard trực quan giúp bạn nắm rõ điểm mạnh, điểm yếu và tiến bộ sau mỗi bài học.",
  },
];

const BenefitsSection = () => {
  return (
    <section className="section-padding section-alt">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Tại sao chọn VSTEPPro?</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Nền tảng luyện thi VSTEP toàn diện nhất
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Mọi thứ bạn cần để chinh phục kỳ thi VSTEP, tất cả trong một nền tảng duy nhất.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="card-edu text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <b.icon size={26} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
