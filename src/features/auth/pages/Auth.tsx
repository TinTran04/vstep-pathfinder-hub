import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, KeyRound, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

type Screen = "login" | "register" | "otp" | "forgot_request" | "forgot_otp" | "forgot_password";

const Auth = () => {
  const [screen, setScreen] = useState<Screen>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, verifyOtp, resendOtp, forgotPassword, verifyResetOtp, resetPassword } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePinChange = (index: number, val: string) => {
    const digits = val.replace(/\D/g, "").split("");
    if (digits.length === 0) {
      const otpArr = form.otp.split("");
      otpArr[index] = "";
      const newOtp = otpArr.join("");
      update("otp", newOtp);
      if (index > 0) {
        const prevInput = document.getElementById(`pin-${index - 1}`);
        prevInput?.focus();
      }
      return;
    }
    const otpArr = form.otp.split("");
    otpArr[index] = digits[0];
    const newOtp = otpArr.join("");
    update("otp", newOtp);
    if (index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (screen === "register" && !form.name.trim())
      errs.name = "Vui lòng nhập họ tên";
    
    if (!form.email.trim()) errs.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email không hợp lệ";

    if (screen !== "forgot_request" && screen !== "forgot_otp") {
      if (!form.password) errs.password = "Vui lòng nhập mật khẩu";
      else if (form.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự";

      if ((screen === "register" || screen === "forgot_password") && form.password !== form.confirmPassword)
        errs.confirmPassword = "Mật khẩu không khớp";
    }

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
    if (import.meta.env.DEV) {
      console.log("[FE-PERF] redirect start");
    }
    if (role === "admin") {
      navigate("/admin");
    } else {
      const redirectUrl = searchParams.get("redirect")
        || sessionStorage.getItem("auth_redirect_after_login")
        || "/dashboard";
      sessionStorage.removeItem("auth_redirect_after_login");
      navigate(redirectUrl);
    }
  };

  // ── Handle Login ───────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (import.meta.env.DEV) {
      sessionStorage.setItem("login_start_time", Date.now().toString());
    }
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      toast.success("Đăng nhập thành công!");
      // role comes from result directly (state may not have updated yet)
      redirectAfterAuth(result.role);
    } else {
      setErrors({ password: result.error || "Đăng nhập thất bại" });
      toast.error(result.error || "Tài khoản hoặc mật khẩu không chính xác.");
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
      const redirectUrl = searchParams.get("redirect") || "/dashboard";
      navigate(redirectUrl);
    } else {
      setErrors({ email: result.error || "Đăng ký thất bại" });
      toast.error(result.error || "Đăng ký tài khoản thất bại.");
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
      toast.success("Xác thực email thành công! Chào mừng bạn đến VstepUp 🎉");
      const redirectUrl = searchParams.get("redirect") || "/dashboard";
      navigate(redirectUrl);
    } else {
      setErrors({ otp: result.error || "Mã OTP không hợp lệ" });
      toast.error(result.error || "Xác thực mã OTP thất bại.");
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

  // ── Handle Forgot Password ─────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await forgotPassword(form.email);
    setLoading(false);
    if (result.success) {
      toast.success("Mã xác thực đã được gửi về Email của bạn!");
      setScreen("forgot_otp");
      setForm((p) => ({ ...p, password: "", confirmPassword: "", otp: "" }));
    } else {
      setErrors({ email: result.error || "Gửi yêu cầu thất bại" });
      toast.error(result.error || "Gửi yêu cầu đặt lại mật khẩu thất bại.");
    }
  };

  // ── Handle Verify Reset OTP ────────────────────────────────────
  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtp()) return;
    setLoading(true);
    const result = await verifyResetOtp(form.email, form.otp);
    setLoading(false);
    if (result.success) {
      toast.success("Mã OTP chính xác! Vui lòng nhập mật khẩu mới.");
      setScreen("forgot_password");
      setForm((p) => ({ ...p, password: "", confirmPassword: "" }));
    } else {
      setErrors({ otp: result.error || "Mã OTP không hợp lệ" });
      toast.error(result.error || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    }
  };

  // ── Handle Reset Password ──────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await resetPassword({
      email: form.email,
      otp: form.otp,
      newPassword: form.password,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
      setScreen("login");
      setForm((p) => ({ ...p, password: "", confirmPassword: "", otp: "" }));
    } else {
      setErrors({ password: result.error || "Đặt lại mật khẩu thất bại" });
      toast.error(result.error || "Đặt lại mật khẩu mới thất bại.");
    }
  };

  // ── Forgot Password Request Screen ────────────────────────────
  if (screen === "forgot_request") {
    return (
      <div className="min-h-screen bg-background flex">
        <LeftPanel />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <button
              onClick={() => setScreen("login")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </button>

            <div>
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <KeyRound className="text-primary-foreground" size={26} />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Quên mật khẩu</h1>
              <p className="text-muted-foreground mt-2">
                Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
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

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold h-11"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Gửi mã xác thực"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot Password OTP Screen ──────────────────────────────────
  if (screen === "forgot_otp") {
    return (
      <div className="min-h-screen bg-background flex">
        <LeftPanel />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <button
              onClick={() => setScreen("forgot_request")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            <div>
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <KeyRound className="text-primary-foreground" size={26} />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Xác thực mã OTP</h1>
              <p className="text-muted-foreground mt-2">
                Mã OTP 6 chữ số đã được gửi tới email <span className="font-semibold text-foreground">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyResetOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-center block text-sm font-semibold">Nhập mã xác thực OTP</Label>
                <div className="flex gap-2 justify-center my-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`pin-${i}`}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none transition-all duration-200"
                      value={form.otp[i] || ""}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !form.otp[i] && i > 0) {
                          const prevInput = document.getElementById(`pin-${i - 1}`);
                          prevInput?.focus();
                        }
                      }}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-sm text-destructive text-center">{errors.otp}</p>
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
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot Password Reset Screen ──────────────────────────────
  if (screen === "forgot_password") {
    return (
      <div className="min-h-screen bg-background flex">
        <LeftPanel />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <button
              onClick={() => setScreen("forgot_otp")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            <div>
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <Lock className="text-primary-foreground" size={26} />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Đặt lại mật khẩu</h1>
              <p className="text-muted-foreground mt-2">
                Nhập mật khẩu mới cho tài khoản <span className="font-semibold text-foreground">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
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

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold h-11"
                disabled={loading}
              >
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── OTP Screen ─────────────────────────────────────────────────
  if (screen === "otp") {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Left panel */}
        <LeftPanel />

        {/* Right panel — OTP */}
        <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="w-full max-w-md space-y-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setScreen("register")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>
              <div className="lg:hidden flex items-center gap-2">
                <img src={logoImg} alt="VstepUp" className="w-6 h-6 rounded-lg object-contain" />
                <span className="font-extrabold text-sm text-primary">VstepUp</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/40 dark:bg-muted/10 p-3 rounded-xl border border-border/60">
              <span className="text-xs font-semibold text-primary">Bước 2/2: Xác thực email</span>
              <div className="flex gap-1 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div className="bg-primary w-full" />
              </div>
            </div>

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
                <Label htmlFor="otp" className="text-center block text-sm font-semibold">Nhập mã xác thực OTP</Label>
                <div className="flex gap-2 justify-center my-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`pin-${i}`}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none transition-all duration-200"
                      value={form.otp[i] || ""}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !form.otp[i] && i > 0) {
                          const prevInput = document.getElementById(`pin-${i - 1}`);
                          prevInput?.focus();
                        }
                      }}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-sm text-destructive text-center">{errors.otp}</p>
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
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Về trang chủ
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <img src={logoImg} alt="VstepUp" className="w-6 h-6 rounded-lg object-contain" />
              <span className="font-extrabold text-sm text-primary">VstepUp</span>
            </div>
          </div>

          {!isLogin && (
            <div className="flex items-center justify-between bg-muted/40 dark:bg-muted/10 p-3 rounded-xl border border-border/60">
              <span className="text-xs font-semibold text-primary">Bước 1/2: Điền thông tin</span>
              <div className="flex gap-1 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div className="bg-primary w-1/2" />
                <div className="bg-muted w-1/2" />
              </div>
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? "Chào mừng bạn quay trở lại VstepUp"
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
                  onClick={() => {
                    setScreen("forgot_request");
                    setErrors({});
                  }}
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
  <div className="hidden lg:flex lg:w-1/2 gradient-primary relative flex-col justify-between p-12 overflow-hidden">
    {/* Floating elements */}
    <div className="absolute top-1/4 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: "5s" }}>
      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md">✓</div>
      <div>
        <p className="text-xs font-bold text-white leading-none">Chuẩn VSTEP 2026</p>
        <p className="text-[9px] text-white/80 mt-0.5">Cập nhật liên tục</p>
      </div>
    </div>

    <div className="absolute bottom-1/4 -left-6 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-2.5">
      <div className="flex -space-x-2">
        <div className="w-6 h-6 rounded-full bg-blue-400 border border-white/40 flex items-center justify-center text-[9px] font-bold text-white">A</div>
        <div className="w-6 h-6 rounded-full bg-amber-400 border border-white/40 flex items-center justify-center text-[9px] font-bold text-white">B</div>
        <div className="w-6 h-6 rounded-full bg-purple-400 border border-white/40 flex items-center justify-center text-[9px] font-bold text-white">C</div>
      </div>
      <p className="text-[10px] font-semibold text-white">10k+ Học viên tin tưởng</p>
    </div>

    <div className="z-10">
      <a href="/" className="flex items-center gap-2.5">
        <img src={logoImg} alt="VstepUp Logo" className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm" />
        <span className="font-extrabold text-2xl text-primary-foreground tracking-tight">VstepUp</span>
      </a>
    </div>

    <div className="space-y-6 z-10">
      <h2 className="text-4xl font-extrabold text-primary-foreground leading-tight tracking-tight">
        Chinh phục VSTEP<br />cùng VstepUp
      </h2>
      <p className="text-primary-foreground/90 text-base max-w-md font-medium leading-relaxed">
        Nền tảng luyện thi VSTEP toàn diện với lộ trình học cá nhân hóa, kho đề thi thử đa dạng và trợ lý chấm điểm thông minh.
      </p>
      <div className="flex gap-8">
        {[
          { num: "10,000+", label: "Học viên" },
          { num: "500+", label: "Bài học" },
          { num: "200+", label: "Đề thi" },
        ].map((s) => (
          <div key={s.label} className="space-y-0.5">
            <div className="text-2xl font-black text-primary-foreground tracking-tight">{s.num}</div>
            <div className="text-primary-foreground/75 text-xs font-semibold">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
    
    <div className="z-10">
      <p className="text-primary-foreground/60 text-xs font-semibold">
        © 2026 VstepUp. Bảo lưu mọi quyền.
      </p>
    </div>
  </div>
);

export default Auth;
