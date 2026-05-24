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
import { plans } from "../mocks/landing.mock";

interface PlanItem {
  name: string;
  price: string;
  rawPrice: number;
  period: string;
  popular: boolean;
  features: string[];
}

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, user, updateUser } = useAuth();

  // Find initial plan from state, query param, or default to Monthly
  const getInitialPlan = (): PlanItem => {
    const statePlan = location.state?.plan;
    if (statePlan) return statePlan;

    const planParam = searchParams.get("plan")?.toLowerCase();
    if (planParam === "week" || planParam === "weekly" || planParam === "gói tuần") {
      const p = plans.find((pl) => pl.rawPrice === 49000);
      if (p) return p;
    }
    
    // Default to monthly plan
    return plans.find((pl) => pl.rawPrice === 199000) || plans[1];
  };

  const [selectedPlan, setSelectedPlan] = useState<PlanItem>(getInitialPlan);
  const [payStep, setPayStep] = useState<"qr" | "processing" | "success">("qr");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState("Đang kết nối cổng VietQR...");
  const [txCode] = useState(() => `VSP${Date.now().toString().slice(-8).toUpperCase()}`);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPay = () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để hệ thống ghi nhận kích hoạt gói VIP!");
      return;
    }

    setPayStep("processing");

    // Sequence of premium status messages
    setTimeout(() => {
      setProcessStatus("Đã nhận được thông tin giao dịch Vietcombank...");
    }, 1200);

    setTimeout(() => {
      setProcessStatus("Đang xác thực thông tin đối soát chuyển khoản...");
    }, 2400);

    setTimeout(() => {
      setProcessStatus("Kích hoạt quyền lợi học viên VIP và đồng bộ hệ thống...");
    }, 3600);

    setTimeout(() => {
      // Update local storage / state plan
      updateUser({ plan: selectedPlan.name });
      setPayStep("success");
      toast.success("Nâng cấp tài khoản thành công! 🎉");
    }, 4800);
  };

  const formattedTransferContent = user
    ? `VSTEPPRO ${txCode} ${user.email.split("@")[0].toUpperCase()}`
    : `VSTEPPRO ${txCode} GUEST`;

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
                      Hãy đăng nhập trước khi thực hiện chuyển khoản để hệ thống tự động kích hoạt quyền lợi Premium cho tài khoản của bạn ngay khi giao dịch hoàn tất.
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

              {/* Bank Transfer Information */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <CreditCard size={20} className="text-primary" />
                    Thông tin chuyển khoản
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quét mã QR bằng ứng dụng ngân hàng hoặc tự chuyển khoản theo thông tin bên dưới.
                  </p>
                </div>

                <div className="grid sm:grid-cols-12 gap-6 items-center">
                  
                  {/* Visual QR Code Display */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 border border-border rounded-xl bg-card shadow-inner relative group">
                    {/* VietQR Header */}
                    <div className="w-full flex justify-between items-center px-1 mb-2">
                      <span className="text-[9px] font-extrabold text-blue-700 tracking-tighter">VietQR</span>
                      <span className="text-[9px] font-extrabold text-red-600 tracking-tighter">Napas247</span>
                    </div>

                    {/* QR Code Graphic Grid Mock */}
                    <div className="w-36 h-36 bg-card border border-border/80 rounded-lg flex items-center justify-center relative overflow-hidden p-2">
                      <div className="grid grid-cols-7 gap-0.5 p-1">
                        {Array.from({ length: 49 }).map((_, i) => (
                          <div key={i} className={`w-3.5 h-3.5 rounded-sm transition-colors duration-300 ${
                            [0,1,2,3,4,5,6,7,8,12,13,14,20,21,27,28,34,35,36,40,41,42,43,44,45,46,47,48].includes(i)
                              ? "bg-foreground"
                              : [10,16,18,23,25,30,32,38].includes(i) ? "bg-foreground/90" : "bg-transparent"
                          }`} />
                        ))}
                      </div>
                      
                      {/* Brand Logo in center of QR */}
                      <div className="absolute inset-0 m-auto w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-black text-xs shadow-md border-2 border-card">
                        VP
                      </div>
                    </div>

                    <div className="w-full text-center mt-2.5">
                      <span className="text-[10px] text-muted-foreground font-medium">Tự động nhận diện số tiền</span>
                    </div>
                  </div>

                  {/* Manual details */}
                  <div className="sm:col-span-7 space-y-4">
                    
                    {/* Bank Name */}
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Ngân hàng</p>
                        <p className="text-sm font-bold text-foreground">Vietcombank (VCB)</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">Miễn phí chuyển khoản</Badge>
                    </div>

                    {/* STK */}
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Số tài khoản</p>
                        <p className="text-sm font-mono font-bold text-foreground tracking-wide">1234 5678 9012</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleCopy("123456789012", "Số tài khoản")}
                      >
                        {copiedField === "Số tài khoản" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </Button>
                    </div>

                    {/* Owner */}
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Chủ tài khoản</p>
                        <p className="text-sm font-semibold text-foreground">CONG TY VSTEPPRO</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Số tiền</p>
                        <p className="text-base font-extrabold text-primary">{selectedPlan.price}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleCopy(selectedPlan.rawPrice.toString(), "Số tiền")}
                      >
                        {copiedField === "Số tiền" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </Button>
                    </div>

                    {/* Message Content */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Nội dung chuyển khoản</p>
                        <p className="text-xs font-mono font-bold text-primary tracking-wide bg-primary/5 px-2 py-1 rounded border border-primary/10 mt-1">
                          {formattedTransferContent}
                        </p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary mt-4"
                        onClick={() => handleCopy(formattedTransferContent, "Nội dung")}
                      >
                        {copiedField === "Nội dung" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </Button>
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="flex-1 gradient-primary text-primary-foreground font-semibold h-11 shadow-md hover:opacity-90"
                    onClick={handleConfirmPay}
                  >
                    Xác nhận đã thanh toán
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-11 font-medium"
                    onClick={() => navigate("/")}
                  >
                    Hủy giao dịch
                  </Button>
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
                  {plans.filter(p => p.rawPrice > 0).map((p) => (
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
