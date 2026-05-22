import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/StaggerChildren";
import { landingService } from "../services/landing.service";

interface TestimonialItem {
  name: string;
  role: string;
  content: string;
  rating: number;
}

const TestimonialSection = () => {
  const [testimonialsList, setTestimonialsList] = useState<TestimonialItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    landingService.getTestimonials().then((data) => {
      if (isMounted) {
        setTestimonialsList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Học viên nói gì</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Được tin tưởng bởi hàng nghìn học viên
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid md:grid-cols-3 gap-6">
          {testimonialsList.map((t) => (
            <StaggerItem key={t.name}>
              <div className="card-edu group hover:border-primary/30 transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                     <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TestimonialSection;
