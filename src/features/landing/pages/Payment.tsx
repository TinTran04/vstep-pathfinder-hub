import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  CheckCircle2, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw,
  Lock,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { paymentService } from "../services/payment.service";
import { landingService } from "../services/landing.service";
import type { PlanItem } from "../services/landing.service";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user, updateUser } = useAuth();

  const [availablePlans, setAvailablePlans] = useState<PlanItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Find initial plan from state, query param, or default to Monthly
  const getInitialPlan = (loadedPlans: PlanItem[]): PlanItem | null => {
    const statePlan = location.state?.plan;
    if (statePlan?.subscriptionPlanId) {
      const matched = loadedPlans.find((plan) => plan.subscriptionPlanId === statePlan.subscriptionPlanId);
      if (matched) return matched;
    }

    const planParam = searchParams.get("plan")?.toLowerCase();
    if (planParam === "week" || planParam === "weekly" || planParam === "goi-tuan") {
      const p = loadedPlans.find((pl) => pl.durationDays === 7 || pl.name.toLowerCase().includes("tuan"));
      if (p) return p;
    }

    return loadedPlans.find((pl) => pl.durationDays >= 30 || pl.name.toLowerCase().includes("thang"))
      || loadedPlans.find((pl) => pl.rawPrice > 0)
      || null;
  };

  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [payStep, setPayStep] = useState<"qr" | "processing" | "success">("qr");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState("Đang kết nối cổng thanh toán...");
  const [txCode] = useState(() => `VSP${Date.now().toString().slice(-8).toUpperCase()}`);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      setPlansLoading(true);
      setPlansError(null);

      try {
        const loadedPlans = await landingService.getPlans();
        const payablePlans = loadedPlans.filter((plan) => plan.rawPrice > 0);
        const initialPlan = getInitialPlan(payablePlans);

        if (!isMounted) return;

        setAvailablePlans(payablePlans);
        setSelectedPlan(initialPlan);
        if (!initialPlan) {
          setPlansError("Hiện chưa có gói thanh toán nào đang khả dụng.");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Load payment plans failed:", error);
        setPlansError("Không thể tải danh sách gói thanh toán. Vui lòng thử lại sau.");
      } finally {
        if (isMounted) {
          setPlansLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, [location.state, searchParams]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPay = async () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để hệ thống ghi nhận kích hoạt gói VIP!");
      return;
    }

    if (!selectedPlan) {
      toast.error("Vui l?ng ch?n g?i thanh to?n.");
      return;
    }

    setLoading(true);
    setPayStep("processing");
    setProcessStatus("Đang tạo link thanh toán PayOS...");

    try {
      const res = await paymentService.createSubscriptionPayment(selectedPlan.subscriptionPlanId);
      if (res.checkoutUrl) {
        setProcessStatus("Đang chuyển hướng đến cổng thanh toán...");
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error("Không nhận được link thanh toán từ cổng.");
      }
    } catch (err: any) {
      toast.error(err.message || "Tạo liên kết thanh toán thất bại. Vui lòng thử lại.");
      setPayStep("qr");
      setLoading(false);
    }
  };

  const formattedTransferContent = user
    ? `VSTEPUP ${txCode} ${user.email.split("@")[0].toUpperCase()}`
    : `VSTEPUP ${txCode} GUEST`;

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (plansError || !selectedPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Không thể mở trang thanh toán</h2>
            <p className="text-sm text-muted-foreground">
              {plansError || "Không tìm thấy gói thanh toán phù hợp."}
            </p>
          </div>
          <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground">
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Quay lại trang chủ
          </button>
          
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Thanh toán bảo mật SSL 256-bit</span>
          </div>
        </div>

        {payStep === "qr" && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: QR & Payment Info */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Login Warning Banner if not logged in */}
              {!isLoggedIn && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-semibold">Bạn chưa đăng nhập tài khoản</p>
                    <p className="text-xs opacity-90">
                      Hãy đăng nhập trước khi thực hiện thanh toán để hệ thống tự động kích hoạt quyền lợi Premium cho tài khoản của bạn ngay khi giao dịch hoàn tất.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-8"
                      onClick={() => navigate(`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
                    >
                      Đăng nhập ngay
                    </Button>
                  </div>
                </div>
              )}

              {/* Secure PayOS Billing Checkout Portal */}
              <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                      Cổng Thanh Toán Tự Động
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                      Mở Khóa Tức Thì
                    </Badge>
                  </div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <CreditCard size={22} className="text-primary" />
                    Thanh toán an toàn qua PayOS
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bạn sẽ được chuyển hướng an toàn tới giao diện thanh toán PayOS để quét mã VietQR hoặc chuyển khoản 24/7 từ bất kỳ ứng dụng ngân hàng nào. Quyền lợi Premium VIP sẽ tự động kích hoạt ngay sau khi giao dịch thành công.
                  </p>
                </div>

                {/* Features Highlights */}
                <div className="grid sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Xử lý tự động 100%</p>
                      <p className="text-[10px] text-muted-foreground">Kích hoạt gói trong 5s</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Bảo mật tuyệt đối</p>
                      <p className="text-[10px] text-muted-foreground">Hỗ trợ bởi cổng Napas</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="flex-1 gradient-primary text-primary-foreground font-bold h-12 shadow-lg hover:opacity-95 transition-all text-sm gap-2 shrink-0 group relative overflow-hidden"
                    onClick={handleConfirmPay}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <>
                        <Zap size={16} className="text-primary-foreground animate-pulse" />
                        <span>Thanh toán ngay bằng PayOS</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 font-semibold text-xs transition-colors shrink-0"
                    onClick={() => navigate("/")}
                    disabled={loading}
                  >
                    Hủy giao dịch
                  </Button>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-center gap-6 text-[10px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-1">
                    <Lock size={12} className="text-muted-foreground" />
                    <span>Mã hóa SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RefreshCw size={12} className="text-muted-foreground" />
                    <span>Hỗ trợ hoàn tiền 24h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order summary and plan swapper */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Plan Swapper Tab Header */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Tóm tắt đơn hàng</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Xác nhận gói đăng ký của bạn</p>
                </div>

                {/* Plan Options Selector in Payment Page */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg text-xs font-medium">
                  {availablePlans.filter(p => p.rawPrice > 0).map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPlan(p)}
                      className={`py-2 px-3 rounded-md transition-all ${
                        selectedPlan.name === p.name 
                          ? "bg-background text-foreground shadow-sm font-bold" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Detailed Plan Billing Summary */}
                <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tên gói:</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      {selectedPlan.name}
                      <Zap size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thời hạn hiệu lực:</span>
                    <span className="font-semibold text-foreground">
                      {selectedPlan.period === "/tháng" ? "1 Tháng (30 Ngày)" : "1 Tuần (7 Ngày)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá gói:</span>
                    <span className="font-bold text-foreground">{selectedPlan.price}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <span className="font-bold text-foreground">Tổng cộng thanh toán:</span>
                    <span className="text-lg font-black text-primary">{selectedPlan.price}</span>
                  </div>
                </div>

                {/* Features included */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground">Đặc quyền VIP của bạn:</p>
                  <ul className="space-y-2">
                    {selectedPlan.features.slice(0, 4).map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* SSL Guarantee Badge */}
                <div className="pt-2 border-t border-border/50 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Lock size={12} className="text-muted-foreground shrink-0" />
                  <span>Mọi thông tin thanh toán của bạn được mã hóa hoàn toàn.</span>
                </div>

              </div>
            </div>

          </div>
        )}

        {payStep === "processing" && (
          <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-md animate-pulse">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CreditCard size={28} className="text-primary animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Đang xác thực giao dịch...</h3>
              <p className="text-sm font-medium text-primary animate-pulse">{processStatus}</p>
              <p className="text-xs text-muted-foreground pt-2">
                Hệ thống ngân hàng đang đối soát tự động. Vui lòng không đóng trình duyệt hoặc tải lại trang.
              </p>
            </div>
          </div>
        )}

        {payStep === "success" && (
          <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-8 shadow-lg relative overflow-hidden animate-fade-in">
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 w-full h-2 gradient-primary" />
            
            <div className="flex flex-col items-center text-center space-y-6 py-4">
              
              {/* Check Circle Animation Container */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 size={54} className="text-emerald-500" />
                </div>
                <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
                <Sparkles size={16} className="absolute -bottom-1 -left-2 text-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-extrabold text-foreground">Nâng Cấp Thành Công! 🎉</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Tài khoản của bạn đã được chuyển đổi sang trạng thái thành viên <strong className="text-foreground">Premium VIP</strong>.
                </p>
              </div>

              {/* Invoice slip */}
              <div className="w-full bg-muted/40 border border-border rounded-xl p-5 space-y-3 text-sm">
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Mã giao dịch:</span>
                  <span className="font-bold text-primary font-mono">{txCode}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Học viên:</span>
                  <span className="font-semibold text-foreground">{user?.name || user?.email || "Học viên VIP"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gói thanh toán:</span>
                  <span className="font-bold text-foreground">{selectedPlan.name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hạn sử dụng:</span>
                  <span className="font-medium text-foreground">
                    {new Date().toLocaleDateString("vi-VN")} — {
                      new Date(Date.now() + (selectedPlan.period === "/tháng" ? 30 : 7) * 86400000).toLocaleDateString("vi-VN")
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-border/80">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                    ✓ Đã thanh toán tự động
                  </Badge>
                </div>

              </div>

              <div className="w-full space-y-2">
                <Button 
                  className="w-full gradient-primary text-primary-foreground font-semibold h-11 shadow-md hover:opacity-90"
                  onClick={() => navigate("/dashboard")}
                >
                  Bắt đầu học ngay
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Bạn có thể quản lý dịch vụ và xem chi tiết tại trang cá nhân bất cứ lúc nào.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Payment;
