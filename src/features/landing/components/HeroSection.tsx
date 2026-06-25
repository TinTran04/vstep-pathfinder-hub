import { ArrowRight, BookOpen, GraduationCap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import heroDashboard from "@/assets/hero-dashboard.png";

const badges = [
  { icon: BookOpen, text: "Chuẩn format VSTEP" },
  { icon: GraduationCap, text: "Phù hợp sinh viên năm cuối" },
  { icon: Globe, text: "Học mọi lúc mọi nơi" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <motion.div
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {badges.map((b, i) => (
                <motion.span
                  key={b.text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                >
                  <b.icon size={14} />
                  {b.text}
                </motion.span>
              ))}
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-tight text-foreground"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Chinh phục VSTEP{" "}
              <span className="text-gradient">hiệu quả</span>
              <br />
              với đề thi thực tế & chấm điểm AI
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground max-w-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Nền tảng luyện thi VSTEP trực tuyến — học đúng format, luyện đề thực tế,  
              chấm điểm AI cho Writing & Speaking, theo dõi tiến độ chi tiết.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Button size="lg" className="gradient-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 hover:shadow-xl transition-all text-base px-8 hover:-translate-y-0.5"
                onClick={() => navigate(isLoggedIn ? "/quiz" : "/auth")}>
                Học thử miễn phí
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="font-semibold text-base px-8 border-2 hover:-translate-y-0.5 transition-all"
                onClick={() => navigate("/quiz")}>
                Làm đề ngay
              </Button>
            </motion.div>


          </div>

          {/* Right image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img src={heroDashboard} alt="Dashboard học VSTEP" className="w-full" loading="lazy" />
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
