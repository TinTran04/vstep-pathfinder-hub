import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Trang chủ", href: "#" },
  { label: "Giới thiệu VSTEP", href: "#vstep-overview" },
  { label: "Practice", href: "/quiz", isRoute: true },
  { label: "Lộ trình học", href: "#journey" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Kết quả học viên", href: "/results", isRoute: true },
  { label: "Đăng ký thi", href: "/vstep-registration", isRoute: true },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-card/95 backdrop-blur-md shadow-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16 md:h-18">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-extrabold text-lg">V</span>
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">VSTEP<span className="text-gradient">Pro</span></span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/auth">Đăng nhập</Link></Button>
          <Button size="sm" className="gradient-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 transition-opacity" asChild>
            <Link to="/auth">Bắt đầu học</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-card border-t border-border px-4 pb-4 space-y-2">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild><Link to="/auth">Đăng nhập</Link></Button>
            <Button size="sm" className="flex-1 gradient-primary text-primary-foreground" asChild><Link to="/auth">Bắt đầu học</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
