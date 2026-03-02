import { useState } from "react";
import { Check, QrCode, CheckCircle2, CreditCard, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Miễn phí",
    price: "0đ",
    rawPrice: 0,
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
    name: "Gói Tháng",
    price: "199.000đ",
    rawPrice: 199000,
    period: "/tháng",
    popular: true,
    features: [
      "Chấm điểm AI không giới hạn",
      "Lộ trình học cá nhân hoá",
      "Toàn bộ bài học 4 kỹ năng",
      "Truy cập đầy đủ ngân hàng đề",
      "Dashboard theo dõi tiến độ",
      "Feedback Speaking & Writing từ AI",
    ],
  },
  {
    name: "Gói Tuần",
    price: "49.000đ",
    rawPrice: 49000,
    period: "/tuần",
    popular: false,
    features: [
      "Dành cho ôn thi ngắn hạn",
      "Chấm điểm AI không giới hạn",
      "Truy cập đầy đủ ngân hàng đề",
      "Lộ trình học cá nhân hoá",
      "Phù hợp ôn nước rút trước kỳ thi",
    ],
  },
];

const PricingSection = () => {
  const [payDialog, setPayDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [payStep, setPayStep] = useState<"qr" | "processing" | "success">("qr");

  const handleRegister = (plan: typeof plans[0]) => {
    if (plan.rawPrice === 0) return;
    setSelectedPlan(plan);
    setPayStep("qr");
    setPayDialog(true);
  };

  const handlePay = () => {
    setPayStep("processing");
    setTimeout(() => {
      setPayStep("success");
    }, 2000);
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
                onClick={() => handleRegister(p)}
              >
                {p.rawPrice === 0 ? "Bắt đầu miễn phí" : "Đăng ký ngay"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={payDialog} onOpenChange={(open) => { if (!open && payStep !== "processing") setPayDialog(false); }}>
        <DialogContent className="max-w-md">
          {payStep === "qr" && selectedPlan && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  Thanh toán {selectedPlan.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gói:</span>
                    <span className="font-semibold text-foreground">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chu kỳ:</span>
                    <span className="font-medium text-foreground">{selectedPlan.period === "/tháng" ? "Hàng tháng" : "Hàng tuần"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-bold text-foreground text-base">{selectedPlan.price}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-44 h-44 bg-card border-2 border-border rounded-xl flex items-center justify-center">
                    <div className="grid grid-cols-7 gap-0.5 p-3">
                      {Array.from({ length: 49 }).map((_, i) => (
                        <div key={i} className={`w-3.5 h-3.5 rounded-sm ${
                          [0,1,2,3,4,5,6,7,8,12,13,14,20,21,27,28,34,35,36,40,41,42,43,44,45,46,47,48].includes(i)
                            ? "bg-foreground"
                            : [10,16,18,23,25,30,32,38].includes(i) ? "bg-foreground" : "bg-transparent"
                        }`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Quét mã QR bằng ứng dụng ngân hàng để thanh toán</p>
                  <div className="text-center space-y-0.5">
                    <p className="text-xs text-muted-foreground">Ngân hàng: <strong className="text-foreground">Vietcombank</strong></p>
                    <p className="text-xs text-muted-foreground">STK: <strong className="text-foreground">1234 5678 9012</strong></p>
                    <p className="text-xs text-muted-foreground">Nội dung: <strong className="text-primary">VSTEPPRO {selectedPlan.name.toUpperCase()}</strong></p>
                  </div>
                </div>

                <Button className="w-full gradient-primary text-primary-foreground" onClick={handlePay}>
                  Xác nhận đã thanh toán
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setPayDialog(false)}>Hủy</Button>
              </div>
            </>
          )}

          {payStep === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {/* Spinner */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CreditCard size={24} className="text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-foreground">Đang xử lý thanh toán...</h3>
                <p className="text-sm text-muted-foreground mt-1">Vui lòng không đóng cửa sổ này</p>
              </div>
            </div>
          )}

          {payStep === "success" && selectedPlan && (
            <div className="flex flex-col items-center py-6 space-y-5 animate-fade-in">
              {/* Success animation */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 size={52} className="text-emerald-500" />
                </div>
                {/* Sparkle effects */}
                <Sparkles size={18} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
                <Sparkles size={14} className="absolute -bottom-1 -left-2 text-primary animate-pulse" style={{ animationDelay: "0.3s" }} />
                <Sparkles size={12} className="absolute top-0 -left-4 text-emerald-400 animate-pulse" style={{ animationDelay: "0.6s" }} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-foreground">Thanh toán thành công! 🎉</h3>
                <p className="text-sm text-muted-foreground">Bạn đã kích hoạt <strong className="text-foreground">{selectedPlan.name}</strong> thành công</p>
              </div>

              <div className="w-full bg-muted/50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gói:</span>
                  <span className="font-semibold text-foreground">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số tiền:</span>
                  <span className="font-bold text-foreground">{selectedPlan.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã GD:</span>
                  <span className="font-medium text-primary">VP{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                    ✓ Đã thanh toán
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hiệu lực:</span>
                  <span className="font-medium text-foreground">
                    {new Date().toLocaleDateString("vi-VN")} — {new Date(Date.now() + (selectedPlan.period === "/tháng" ? 30 : 7) * 86400000).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => setPayDialog(false)}>
                Bắt đầu học ngay
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PricingSection;
