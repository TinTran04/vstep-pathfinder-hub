// src/features/landing/pages/PaymentReturn.tsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Home,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { paymentService } from "../services/payment.service";

const PaymentReturn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isInitialising, user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedPlan, setConfirmedPlan] = useState("");
  const processedRef = useRef(false);

  const status = searchParams.get("status") || "";
  const code = searchParams.get("code") || "";
  const cancel = searchParams.get("cancel") || "";
  const orderCode = searchParams.get("orderCode") || "";

  useEffect(() => {
    if (isInitialising) return;
    if (processedRef.current) return;

    const processPayment = async () => {
      if (!isLoggedIn) {
        setIsSuccess(false);
        toast.error("Vui lòng đăng nhập lại để xác minh thanh toán.");
        setLoading(false);
        return;
      }

      processedRef.current = true;
      const normalizedStatus = status.toUpperCase();
      const isCancel =
        location.pathname.includes("/cancel") ||
        cancel.toLowerCase() === "true" ||
        normalizedStatus === "CANCELLED" ||
        normalizedStatus === "CANCELED";
      const redirectLooksSuccessful =
        location.pathname.includes("/success") ||
        normalizedStatus === "PAID" ||
        normalizedStatus === "COMPLETED" ||
        code === "00";

      if (isCancel) {
        setIsSuccess(false);
        toast.error("Giao dịch đã bị hủy.");
        setLoading(false);
        return;
      }

      const parsedOrderCode = Number(orderCode);
      if (!orderCode || !Number.isFinite(parsedOrderCode) || parsedOrderCode <= 0) {
        setIsSuccess(false);
        toast.error("Không tìm thấy mã đơn hàng để xác minh thanh toán.");
        setLoading(false);
        return;
      }

      if (!redirectLooksSuccessful) {
        setIsSuccess(false);
        toast.error("Thanh toán thất bại hoặc có lỗi xảy ra.");
        setLoading(false);
        return;
      }

      try {
        const confirmed = await paymentService.confirmPayOsPayment(parsedOrderCode);
        const confirmedStatus = confirmed.status.toLowerCase();

        if (confirmedStatus === "paid") {
          setIsSuccess(true);
          setConfirmedPlan(confirmed.subscriptionPlan);
          updateUser({ plan: confirmed.subscriptionPlan });
          toast.success("Thanh toán thành công!", {
            description: `Gói ${confirmed.subscriptionPlan} đã được kích hoạt.`,
          });
        } else {
          setIsSuccess(false);
          toast.error("Thanh toán chưa được xác nhận. Vui lòng thử lại sau.");
        }
      } catch (err) {
        console.error("Payment confirmation failed:", err);
        setIsSuccess(false);
        toast.error("Không thể xác minh thanh toán với máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [cancel, code, isInitialising, isLoggedIn, location.pathname, orderCode, status, updateUser]);

  const displayPlan = confirmedPlan || user?.plan || "Premium";
  const displayStudent = user?.name || user?.email || "Học viên";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {loading ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-md">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Đang đối soát giao dịch...</h3>
              <p className="text-xs text-muted-foreground">
                Đang kiểm tra kết quả thanh toán từ PayOS. Vui lòng không đóng trình duyệt.
              </p>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg relative overflow-hidden text-center space-y-6 animate-scale-in">
            <div className="absolute top-0 left-0 w-full h-2 gradient-primary" />

            <div className="relative w-24 h-24 mx-auto">
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={54} className="text-emerald-500" />
              </div>
              <Sparkles size={20} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
              <Sparkles
                size={16}
                className="absolute -bottom-1 -left-2 text-primary animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-foreground">Giao dịch thành công!</h3>
              <p className="text-sm text-muted-foreground px-2">
                Cảm ơn bạn đã đăng ký dịch vụ của VSTEPPro. Tài khoản của bạn hiện là thành viên{" "}
                <strong>{displayPlan}</strong>.
              </p>
            </div>

            <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-3 text-sm text-left">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mã đơn hàng:</span>
                <span className="font-bold text-primary font-mono">{orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Học viên:</span>
                <span className="font-semibold text-foreground">{displayStudent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gói thanh toán:</span>
                <span className="font-bold text-foreground">{displayPlan}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/80">
                <span className="text-muted-foreground">Trạng thái:</span>
                <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 font-bold">
                  Đã kích hoạt
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
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
              <XCircle size={48} className="text-rose-500" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Thanh toán chưa hoàn tất</h3>
              <p className="text-sm text-muted-foreground px-4 leading-relaxed">
                Giao dịch của bạn đã bị hủy hoặc chưa nhận được xác nhận thanh toán từ PayOS.
              </p>
            </div>

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
