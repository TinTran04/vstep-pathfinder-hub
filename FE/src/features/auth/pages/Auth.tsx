import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

type Screen = "login" | "register" | "otp";

const Auth = () => {
  const [screen, setScreen] = useState<Screen>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { login, register, verifyOtp, resendOtp } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (screen === "register" && !form.name.trim())
      errs.name = "Vui lòng nhập họ tên";
    if (!form.email.trim()) errs.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email không hợp lệ";
    if (!form.password) errs.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự";
    if (screen === "register" && form.password !== form.confirmPassword)
      errs.confirmPassword = "Mật khẩu không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateOtp = () => {
    const errs: Record<string, string> = {};
    if (!form.otp.trim()) errs.otp = "Vui lòng nhập mã OTP";
    else if (!/^\d{6}$/.test(form.otp)) errs.otp = "OTP phải là 6 chữ số";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  // ── Redirect after login/verify ────────────────────────────────
  const redirectAfterAuth = (role?: string) => {
    navigate(role === "admin" ? "/admin" : "/dashboard");
  };

  // ── Handle Login ───────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      toast.success("Đăng nhập thành công!");
      // role comes from result directly (state may not have updated yet)
      redirectAfterAuth(result.role);
    } else {
      setErrors({ password: result.error || "Đăng nhập thất bại" });
    }
  };

  // ── Handle Register (step 1) ───────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await register(form.name, form.email, form.password);
    setLoading(false);
    if (result.success && result.needsOtp) {
      toast.success("Đã gửi mã OTP đến email của bạn!");
      setScreen("otp");
    } else if (result.success) {
      // Fallback nếu BE không cần OTP
      toast.success("Đăng ký thành công!");
      navigate("/dashboard");
    } else {
      setErrors({ email: result.error || "Đăng ký thất bại" });
    }
  };

  // ── Handle OTP Verify (step 2) ─────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtp()) return;
    setLoading(true);
    const result = await verifyOtp(form.email, form.otp);
    setLoading(false);
    if (result.success) {
      toast.success("Xác thực email thành công! Chào mừng bạn đến VSTEPPro 🎉");
      navigate("/dashboard");
    } else {
      setErrors({ otp: result.error || "Mã OTP không hợp lệ" });
    }
  };

  // ── Handle Resend OTP ──────────────────────────────────────────
  const handleResendOtp = async () => {
    setResending(true);
    const result = await resendOtp(form.email);
    setResending(false);
    if (result.success) {
      toast.success("Đã gửi lại mã OTP!");
    } else {
      toast.error(result.error || "Không thể gửi lại OTP");
    }
  };

  // ── OTP Screen ─────────────────────────────────────────────────
  if (screen === "otp") {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Left panel */}
        <LeftPanel />

        {/* Right panel — OTP */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <button
              onClick={() => setScreen("register")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            <div>
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <KeyRound className="text-primary-foreground" size={26} />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Xác thực email</h1>
              <p className="text-muted-foreground mt-2">
                Mã OTP 6 chữ số đã được gửi tới{" "}
                <span className="font-semibold text-foreground">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp">Mã OTP</Label>
                <div className="relative">
                  <KeyRound
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="pl-10 text-center tracking-[0.5em] text-lg font-mono"
                    value={form.otp}
                    onChange={(e) => update("otp", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold h-11"
                disabled={loading}
              >
                {loading ? "Đang xác thực..." : "Xác nhận OTP"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Không nhận được mã?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="mt-1 flex items-center gap-1.5 mx-auto text-sm text-primary font-semibold hover:underline disabled:opacity-50"
              >
                <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                {resending ? "Đang gửi..." : "Gửi lại OTP"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Login / Register Screen ────────────────────────────────────
  const isLogin = screen === "login";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <LeftPanel />

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Về trang chủ
          </button>

          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? "Chào mừng bạn quay trở lại VSTEPPro"
                : "Tạo tài khoản để bắt đầu hành trình VSTEP"}
            </p>
          </div>

          <form
            onSubmit={isLogin ? handleLogin : handleRegister}
            className="space-y-5"
          >
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="name"
                    placeholder="Nguyễn Văn A"
                    className="pl-10"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-10"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground font-semibold h-11"
              disabled={loading}
            >
              {loading
                ? "Đang xử lý..."
                : isLogin
                ? "Đăng nhập"
                : "Đăng ký"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              className="text-primary font-semibold hover:underline"
              onClick={() => {
                setScreen(isLogin ? "register" : "login");
                setErrors({});
              }}
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Shared left branding panel ─────────────────────────────────────
const LeftPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 gradient-primary relative flex-col justify-between p-12">
    <div>
      <a href="/" className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
          <span className="text-primary-foreground font-extrabold text-xl">V</span>
        </div>
        <span className="font-bold text-2xl text-primary-foreground">VSTEPPro</span>
      </a>
    </div>
    <div className="space-y-6">
      <h2 className="text-4xl font-extrabold text-primary-foreground leading-tight">
        Chinh phục VSTEP<br />cùng VSTEPPro
      </h2>
      <p className="text-primary-foreground/80 text-lg max-w-md">
        Nền tảng luyện thi VSTEP hàng đầu với hệ thống bài học, đề thi mô
        phỏng và theo dõi tiến độ thông minh.
      </p>
      <div className="flex gap-6">
        {[
          { num: "10,000+", label: "Học viên" },
          { num: "500+", label: "Bài học" },
          { num: "200+", label: "Đề thi" },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-bold text-primary-foreground">{s.num}</div>
            <div className="text-primary-foreground/70 text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
    <p className="text-primary-foreground/50 text-sm">
      © 2024 VSTEPPro. All rights reserved.
    </p>
  </div>
);

export default Auth;
