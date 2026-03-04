import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, BarChart3, ShoppingBag, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Trang chủ", href: "#" },
  { label: "Giới thiệu VSTEP", href: "#vstep-overview" },
  { label: "Practice", href: "/quiz", isRoute: true },
  { label: "Bài Mẫu", href: "/writing-samples", isRoute: true },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Kết quả học viên", href: "/results", isRoute: true },
  { label: "Lịch thi", href: "/vstep-registration", isRoute: true },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isLoggedIn, user, login, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-card/95 backdrop-blur-md shadow-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16 md:h-18">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <img src={logoImg} alt="VSTEPPro" className="w-9 h-9 rounded-xl object-contain" />
          <span className="font-bold text-xl text-foreground tracking-tight">VSTEP<span className="text-gradient">Pro</span></span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) =>
            (l as any).isRoute ? (
              <Link key={l.label} to={l.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
                {l.label}
              </a>
            )
          )}
        </nav>

        {/* Desktop CTA / User */}
        <div className="hidden lg:flex items-center gap-3">
          {isLoggedIn && user ? (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors"
              >
                <Avatar className="w-8 h-8">
                  {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground max-w-[100px] truncate">{user.name}</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-border mb-1">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <BarChart3 size={16} /> Dashboard
                  </Link>
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <ShoppingBag size={16} /> Đổi thưởng
                  </Link>
                  <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Settings size={16} /> Cài đặt
                  </Link>
                  <div className="border-t border-border mt-1 pt-1">
                    <button onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={login}>Đăng nhập (Test)</Button>
              <Button size="sm" className="gradient-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 transition-opacity" asChild>
                <Link to="/auth">Bắt đầu học</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-card border-t border-border px-4 pb-4 space-y-2">
          {navLinks.map((l) =>
            (l as any).isRoute ? (
              <Link key={l.label} to={l.href}
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
                onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href}
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
                onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            )
          )}

          {isLoggedIn && user ? (
            <div className="border-t border-border pt-2 space-y-1">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="w-8 h-8">
                  {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Link to="/dashboard" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
              <button onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-destructive rounded-lg">
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { login(); setMobileOpen(false); }}>Đăng nhập (Test)</Button>
              <Button size="sm" className="flex-1 gradient-primary text-primary-foreground" asChild>
                <Link to="/auth" onClick={() => setMobileOpen(false)}>Bắt đầu học</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
