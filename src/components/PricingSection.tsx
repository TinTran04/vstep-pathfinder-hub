import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Miễn phí",
    price: "0đ",
    period: "Mãi mãi",
    popular: false,
    features: [
      "Truy cập 10 bài học cơ bản",
      "1 đề thi thử miễn phí",
      "Xem lộ trình học tổng quan",
      "Hỗ trợ cộng đồng",
    ],
  },
  {
    name: "Cơ bản",
    price: "199.000đ",
    period: "/tháng",
    popular: true,
    features: [
      "Toàn bộ bài học 4 kỹ năng",
      "Truy cập đầy đủ ngân hàng đề",
      "Dashboard theo dõi tiến độ",
      "Lộ trình học cá nhân hoá",
      "Chấm điểm Writing tự động",
    ],
  },
  {
    name: "Nâng cao",
    price: "349.000đ",
    period: "/tháng",
    popular: false,
    features: [
      "Tất cả quyền lợi gói Cơ bản",
      "Feedback Speaking từ AI",
      "Hỗ trợ 1-1 với mentor",
      "Đề thi độc quyền cập nhật",
      "Ôn tập trước kỳ thi tập trung",
      "Chứng nhận hoàn thành khoá học",
    ],
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="section-padding section-alt">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Bảng giá</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Chọn gói học phù hợp với bạn
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Bắt đầu miễn phí, nâng cấp khi bạn sẵn sàng.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`card-edu relative ${
                p.popular ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : ""
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full gradient-primary text-primary-foreground">
                  Phổ biến nhất
                </span>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-extrabold text-foreground">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={16} className="text-accent mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full font-semibold ${
                  p.popular
                    ? "gradient-primary text-primary-foreground hover:opacity-90"
                    : ""
                }`}
                variant={p.popular ? "default" : "outline"}
              >
                {p.price === "0đ" ? "Bắt đầu miễn phí" : "Đăng ký ngay"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
