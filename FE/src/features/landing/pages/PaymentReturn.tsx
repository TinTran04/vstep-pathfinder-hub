// src/features/landing/pages/PaymentReturn.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, Home, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";

const PaymentReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const status = searchParams.get("status") || "";
  const orderCode = searchParams.get("orderCode") || "";

  useEffect(() => {
    const processPayment = async () => {
      // PayOS returns PAID or COMPLETED on successful payments
      const success = status === "PAID" || status === "COMPLETED";
      setIsSuccess(success);

      if (success) {
        toast.success("Thanh toán thành công! 🎉", {
          description: "Gói Premium VIP đã được kích hoạt.",
        });

        // Force a session refresh to get the updated subscriptionPlan from backend
        try {
          await authService.refreshToken();
        } catch (err) {
          console.error("Silent refresh failed, updating local state fallback:", err);
        }

        // Fallback update to ensure UI changes immediately even if token refresh takes a moment
        updateUser({ plan: "Gói Tháng" });
      } else if (status === "CANCELLED") {
        toast.error("Giao dịch đã bị hủy.");
      } else {
        toast.error("Thanh toán thất bại hoặc có lỗi xảy ra.");
      }
      setLoading(false);
    };

    processPayment();
  }, [status, updateUser]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {loading ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-md">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Đang đối soát giao dịch...</h3>
              <p className="text-xs text-muted-foreground">
                Đang kiểm tra kết quả thanh toán từ cổng PayOS. Vui lòng không đóng trình duyệt.
              </p>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg relative overflow-hidden text-center space-y-6 animate-scale-in">
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 w-full h-2 gradient-primary" />

            {/* Check Circle Animation Container */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={54} className="text-emerald-500" />
              </div>
              <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
              <Sparkles size={16} className="absolute -bottom-1 -left-2 text-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-foreground">Giao Dịch Thành Công! 🎉</h3>
              <p className="text-sm text-muted-foreground px-2">
                Cảm ơn bạn đã đăng ký dịch vụ của VSTEPPro. Tài khoản của bạn hiện là thành viên <strong>Premium VIP</strong>.
              </p>
            </div>

            {/* Billing Summary Box */}
            <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-3 text-sm text-left">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mã đơn hàng:</span>
                <span className="font-bold text-primary font-mono">{orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Học viên:</span>
                <span className="font-semibold text-foreground">{user?.name || user?.email || "Học viên VIP"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gói thanh toán:</span>
                <span className="font-bold text-foreground">Premium VIP</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/80">
                <span className="text-muted-foreground">Trạng thái:</span>
                <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 font-bold">
                  ✓ Đã kích hoạt
                </Badge>
              </div>
            </div>

            <div className="space-y-2.5">
              <Button 
                className="w-full gradient-primary text-primary-foreground font-semibold h-12 shadow-md hover:opacity-95 text-sm gap-2"
                onClick={() => navigate("/dashboard")}
              >
                <span>Bắt đầu học ngay</span>
                <ArrowRight size={16} />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/")}
              >
                <Home size={13} className="mr-1.5" />
                Về trang chủ
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-md text-center space-y-6 animate-scale-in">
            {/* Fail Circle Container */}
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
              <XCircle size={48} className="text-rose-500" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Thanh Toán Chưa Hoàn Tất</h3>
              <p className="text-sm text-muted-foreground px-4 leading-relaxed">
                Giao dịch của bạn đã bị hủy hoặc chưa nhận được thông tin thanh toán từ cổng ngân hàng.
              </p>
            </div>

            {/* Error Actions */}
            <div className="space-y-2.5">
              <Button 
                className="w-full gradient-primary text-primary-foreground font-semibold h-12 shadow-md text-sm gap-2"
                onClick={() => navigate("/payment")}
              >
                <RefreshCw size={15} />
                <span>Thử thanh toán lại</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-xs h-11"
                onClick={() => navigate("/")}
              >
                <Home size={13} className="mr-1.5" />
                Về trang chủ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentReturn;
