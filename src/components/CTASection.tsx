import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="section-padding">
      <div className="max-w-4xl mx-auto text-center">
        <div className="rounded-3xl gradient-primary p-10 md:p-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold">
              Sẵn sàng chinh phục VSTEP?
            </h2>
            <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto">
              Tham gia cùng hàng nghìn học viên đang luyện thi hiệu quả trên VSTEPPro. Bắt đầu ngay hôm nay — hoàn toàn miễn phí.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Button size="lg" variant="secondary" className="font-semibold text-base">
                Bắt đầu học ngay
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button size="lg" variant="ghost" className="font-semibold text-base text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/10">
                Xem lộ trình
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
