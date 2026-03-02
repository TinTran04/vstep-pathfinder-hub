import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Nguyễn Minh Anh",
    role: "Sinh viên năm cuối — ĐH Bách Khoa",
    content: "Mình đã đạt B2 VSTEP sau 2 tháng luyện trên VSTEPPro. Lộ trình rõ ràng, đề thi sát thực tế, dashboard giúp mình biết điểm yếu để cải thiện.",
    rating: 5,
  },
  {
    name: "Trần Văn Hùng",
    role: "Nhân viên văn phòng",
    content: "Là người đi làm, mình không có nhiều thời gian nhưng với lộ trình tự học của VSTEPPro, mình vẫn ôn được đều đặn mỗi ngày và đã thi đỗ B1.",
    rating: 5,
  },
  {
    name: "Phạm Thị Hương",
    role: "Sinh viên năm cuối — ĐH Sư Phạm",
    content: "Tính năng luyện đề có tính giờ giúp mình quản lý thời gian tốt hơn rất nhiều. Điểm Reading và Listening tăng rõ rệt chỉ sau 3 tuần.",
    rating: 5,
  },
];

const TestimonialSection = () => {
  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Học viên nói gì</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Được tin tưởng bởi hàng nghìn học viên
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="card-edu">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
