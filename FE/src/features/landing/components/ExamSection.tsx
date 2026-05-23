import { Clock, CheckCircle, BarChart3, Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Layers, text: "Đề thi mô phỏng chuẩn VSTEP" },
  { icon: Clock, text: "Tính giờ làm bài thực tế" },
  { icon: CheckCircle, text: "Chấm điểm & đáp án chi tiết" },
  { icon: BarChart3, text: "Thống kê kết quả theo kỹ năng" },
];

const ExamSection = () => {
  return (
    <section id="exam" className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl gradient-primary p-8 md:p-14 text-primary-foreground relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider opacity-80">Luyện đề thi</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">
                Luyện đề VSTEP như thi thật
              </h2>
              <p className="mt-4 text-lg opacity-90 leading-relaxed">
                Hệ thống đề thi mô phỏng hoàn chỉnh với đầy đủ 4 kỹ năng, 
                giúp bạn làm quen áp lực thời gian và cấu trúc đề thực tế.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Button size="lg" variant="secondary" className="font-semibold text-base">
                  Thử đề miễn phí
                  <ArrowRight size={18} className="ml-2" />
                </Button>
                <Button size="lg" variant="ghost" className="font-semibold text-base text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/10">
                  Xem tất cả đề thi
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.text} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                  <f.icon size={28} className="mb-3 opacity-90" />
                  <p className="text-sm font-medium leading-snug">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExamSection;
