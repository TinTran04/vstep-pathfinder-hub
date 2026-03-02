import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Phone, Mail, Globe, Clock, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const examSchedule = [
  { date: "15/04/2026", location: "ĐH Quốc gia Hà Nội", slots: 200, status: "open" },
  { date: "22/04/2026", location: "ĐH Sư phạm TP.HCM", slots: 150, status: "open" },
  { date: "06/05/2026", location: "ĐH Đà Nẵng", slots: 120, status: "open" },
  { date: "20/05/2026", location: "ĐH Cần Thơ", slots: 100, status: "upcoming" },
  { date: "10/06/2026", location: "ĐH Quốc gia Hà Nội", slots: 200, status: "upcoming" },
  { date: "24/06/2026", location: "ĐH Huế", slots: 80, status: "upcoming" },
];

const centers = [
  {
    name: "Trung tâm Khảo thí ĐH Quốc gia Hà Nội",
    address: "144 Xuân Thủy, Cầu Giấy, Hà Nội",
    phone: "024 3754 7670",
    email: "vstep@vnu.edu.vn",
    website: "https://ettc.vnu.edu.vn",
  },
  {
    name: "Trung tâm Ngoại ngữ ĐH Sư phạm TP.HCM",
    address: "280 An Dương Vương, Quận 5, TP.HCM",
    phone: "028 3835 4409",
    email: "flc@hcmue.edu.vn",
    website: "https://hcmue.edu.vn",
  },
  {
    name: "Trung tâm Ngoại ngữ ĐH Đà Nẵng",
    address: "41 Lê Duẩn, Hải Châu, Đà Nẵng",
    phone: "0236 3822 041",
    email: "sfl@udn.vn",
    website: "https://udn.vn",
  },
];

const VstepRegistration = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
          <span className="font-bold text-foreground">Đăng ký thi VSTEP</span>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Đăng ký thi <span className="text-gradient">VSTEP</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Thông tin lịch thi, địa điểm và hướng dẫn đăng ký thi VSTEP trên toàn quốc. Dữ liệu được cập nhật thường xuyên.
          </p>
        </div>

        {/* Exam info cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: FileText, label: "Lệ phí thi", value: "1.800.000 VNĐ", desc: "Cho 4 kỹ năng" },
            { icon: Clock, label: "Thời gian thi", value: "~172 phút", desc: "Listening + Reading + Writing + Speaking" },
            { icon: Users, label: "Giá trị chứng chỉ", value: "2 năm", desc: "Kể từ ngày cấp" },
          ].map((item) => (
            <Card key={item.label} className="border-border">
              <CardContent className="p-5 text-center space-y-2">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <item.icon size={22} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Exam Schedule */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Calendar size={22} className="text-primary" /> Lịch thi VSTEP sắp tới
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examSchedule.map((exam, i) => (
              <Card key={i} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">{exam.date}</span>
                    <Badge variant={exam.status === "open" ? "default" : "secondary"} className={exam.status === "open" ? "gradient-primary text-primary-foreground" : ""}>
                      {exam.status === "open" ? "Đang mở" : "Sắp mở"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} className="shrink-0" />
                    <span>{exam.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={14} className="shrink-0" />
                    <span>{exam.slots} chỗ</span>
                  </div>
                  {exam.status === "open" && (
                    <Button size="sm" className="w-full gradient-primary text-primary-foreground mt-2">
                      Đăng ký ngay
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Exam Centers */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MapPin size={22} className="text-primary" /> Địa điểm tổ chức thi
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {centers.map((center) => (
              <Card key={center.name} className="border-border">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-foreground text-sm">{center.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="shrink-0 mt-0.5" />
                      <span>{center.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="shrink-0" />
                      <span>{center.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="shrink-0" />
                      <span>{center.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="shrink-0" />
                      <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Website
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Bạn muốn ôn thi trước khi đăng ký?</p>
          <div className="flex gap-3 justify-center">
            <Button asChild className="gradient-primary text-primary-foreground">
              <Link to="/quiz">Luyện đề ngay</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Về trang chủ</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VstepRegistration;
