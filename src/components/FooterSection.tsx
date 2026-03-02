import { Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-foreground text-primary-foreground/80">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-extrabold text-lg">V</span>
              </div>
              <span className="font-bold text-xl text-primary-foreground">VSTEPPro</span>
            </div>
            <p className="text-sm leading-relaxed opacity-70">
              Nền tảng luyện thi VSTEP trực tuyến hàng đầu Việt Nam. Học đúng format, luyện đề thực tế, đạt chuẩn đầu ra.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">4 Kỹ năng</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Luyện đề thi</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Lộ trình học</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Bảng giá</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Hướng dẫn sử dụng</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Chính sách bảo mật</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary-foreground mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0" />
                contact@vsteppro.vn
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0" />
                0123 456 789
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="shrink-0 mt-0.5" />
                Hà Nội, Việt Nam
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-sm opacity-60">
          © 2026 VSTEPPro. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
