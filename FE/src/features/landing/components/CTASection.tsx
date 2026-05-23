import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="section-padding">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          className="rounded-3xl gradient-primary p-10 md:p-16 text-primary-foreground relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative">
            <motion.h2
              className="text-3xl md:text-4xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Sẵn sàng chinh phục VSTEP?
            </motion.h2>
            <motion.p
              className="mt-4 text-lg opacity-90 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Tham gia cùng hàng nghìn học viên đang luyện thi hiệu quả trên VSTEPPro. Bắt đầu ngay hôm nay — hoàn toàn miễn phí.
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-3 mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button size="lg" variant="secondary" className="font-semibold text-base hover:-translate-y-0.5 transition-all hover:shadow-lg">
                Bắt đầu học ngay
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button size="lg" variant="ghost" className="font-semibold text-base text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/10 hover:-translate-y-0.5 transition-all">
                Xem lộ trình
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
