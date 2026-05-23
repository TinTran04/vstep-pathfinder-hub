import { useState, useEffect } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/StaggerChildren";
import { landingService } from "../services/landing.service";

interface BenefitItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}

const BenefitsSection = () => {
  const [benefitsList, setBenefitsList] = useState<BenefitItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    landingService.getBenefits().then((data) => {
      if (isMounted) {
        setBenefitsList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="section-padding section-alt">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Tại sao chọn VSTEPPro?</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Nền tảng luyện thi VSTEP toàn diện nhất
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Mọi thứ bạn cần để chinh phục kỳ thi VSTEP, tất cả trong một nền tảng duy nhất.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefitsList.map((b) => (
            <StaggerItem key={b.title}>
              <div className="card-edu text-center group cursor-default">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <b.icon size={26} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default BenefitsSection;
