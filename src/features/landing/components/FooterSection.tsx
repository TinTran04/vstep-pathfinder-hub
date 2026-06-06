import { Mail } from "lucide-react";
import logoImg from "@/assets/logo.png";

const FooterSection = () => {
  return (
    <footer className="bg-foreground text-primary-foreground/80">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoImg} alt="VStepUp" className="w-9 h-9 rounded-xl object-contain" />
              <span className="font-bold text-xl text-primary-foreground">VStepUp</span>
            </div>
            <p className="text-sm leading-relaxed opacity-70">
              Nền tảng luyện thi VSTEP trực tuyến hàng đầu Việt Nam. Học đúng format, luyện đề thực tế, đạt chuẩn đầu ra.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#skills" className="hover:text-primary-foreground transition-colors">4 Kỹ năng</a></li>
              <li><a href="#exam" className="hover:text-primary-foreground transition-colors">Luyện đề thi</a></li>
              <li><a href="#journey" className="hover:text-primary-foreground transition-colors">Lộ trình học</a></li>
              <li><a href="#pricing" className="hover:text-primary-foreground transition-colors">Bảng giá</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0" />
                vstepup.official@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-sm opacity-60">
          © 2026 VStepUp. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
