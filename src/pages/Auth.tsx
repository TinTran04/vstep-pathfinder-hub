import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isLogin && !form.name.trim()) errs.name = "Vui lòng nhập họ tên";
    if (!form.email.trim()) errs.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email không hợp lệ";
    if (!form.password) errs.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự";
    if (!isLogin && form.password !== form.confirmPassword) errs.confirmPassword = "Mật khẩu không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: isLogin ? "Đăng nhập thành công!" : "Đăng ký thành công!",
        description: isLogin ? "Chào mừng bạn quay trở lại." : "Tài khoản đã được tạo thành công.",
      });
      navigate("/dashboard");
    }, 1200);
  };

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
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
            Nền tảng luyện thi VSTEP hàng đầu với hệ thống bài học, đề thi mô phỏng và theo dõi tiến độ thông minh.
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
        <p className="text-primary-foreground/50 text-sm">© 2024 VSTEPPro. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Về trang chủ
          </button>

          <div>
            <h1 className="text-3xl font-bold text-foreground">{isLogin ? "Đăng nhập" : "Đăng ký"}</h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Chào mừng bạn quay trở lại VSTEPPro" : "Tạo tài khoản để bắt đầu hành trình VSTEP"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" placeholder="Nguyễn Văn A" className="pl-10" value={form.name} onChange={(e) => update("name", e.target.value)} />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="email@example.com" className="pl-10" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" value={form.password} onChange={(e) => update("password", e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirmPassword" type="password" placeholder="••••••••" className="pl-10" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-primary hover:underline">Quên mật khẩu?</button>
              </div>
            )}

            <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold h-11" disabled={loading}>
              {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button className="text-primary font-semibold hover:underline" onClick={() => { setIsLogin(!isLogin); setErrors({}); }}>
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
