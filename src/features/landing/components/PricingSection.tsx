import { useState, useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingService } from "../services/landing.service";
import type { PlanItem } from "../services/landing.service";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const [plansList, setPlansList] = useState<PlanItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    landingService.getPlans().then((data) => {
      if (isMounted) {
        setPlansList(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRegister = (plan: PlanItem) => {
    if (plan.rawPrice === 0) return;
    navigate("/payment", { state: { plan } });
  };

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
          {plansList.map((p) => (
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
              <ul className="space-y-2.5 mb-8 flex flex-col items-start w-full px-6">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground text-left">
                    <Check size={16} className="text-accent shrink-0 mt-0.5" />
                    <span>{f}</span>
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
                onClick={() => handleRegister(p)}
              >
                {p.rawPrice === 0 ? "Bắt đầu miễn phí" : "Đăng ký ngay"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
