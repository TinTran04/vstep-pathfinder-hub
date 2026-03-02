import { ArrowRight, BookOpen, GraduationCap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroDashboard from "@/assets/hero-dashboard.png";

const badges = [
  { icon: BookOpen, text: "Chuẩn format VSTEP" },
  { icon: GraduationCap, text: "Phù hợp sinh viên năm cuối" },
  { icon: Globe, text: "Học mọi lúc mọi nơi" },
];

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                >
                  <b.icon size={14} />
                  {b.text}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-tight text-foreground">
              Chinh phục VSTEP{" "}
              <span className="text-gradient">hiệu quả</span>
              <br />
              với lộ trình học thông minh
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Nền tảng luyện thi VSTEP trực tuyến hàng đầu — học đúng format, luyện đề thực tế, 
              theo dõi tiến độ chi tiết. Nâng cao cơ hội đạt chuẩn đầu ra nhanh chóng.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="gradient-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition-opacity text-base px-8">
                Học thử miễn phí
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="font-semibold text-base px-8 border-2">
                Làm đề ngay
              </Button>
            </div>

            <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-card" />
                ))}
              </div>
              <span><strong className="text-foreground">2,500+</strong> học viên đang luyện thi</span>
            </div>
          </div>

          {/* Right image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img src={heroDashboard} alt="Dashboard học VSTEP" className="w-full" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-4 card-edu p-4 flex items-center gap-3 max-w-[220px]">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Đạt B2 VSTEP</p>
                <p className="text-xs text-muted-foreground">Tỷ lệ đỗ 89%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
