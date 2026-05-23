import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Phone, Mail, Globe, Clock, Users, FileText, DollarSign, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { registrationService } from "../services/registration.service";

interface ExamScheduleItem {
  date: string;
  location: string;
  slots: number;
  status: string;
}

interface CenterItem {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

const VstepRegistration = () => {
  const [qrDialog, setQrDialog] = useState(false);
  const [qrExam, setQrExam] = useState<ExamScheduleItem | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [schedule, setSchedule] = useState<ExamScheduleItem[]>([]);
  const [centerList, setCenterList] = useState<CenterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      registrationService.getExamSchedule(),
      registrationService.getCenters(),
    ]).then(([schedData, centerData]) => {
      if (isMounted) {
        setSchedule(schedData);
        setCenterList(centerData);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-set logged in for testing payment flow
  useState(() => {
    localStorage.setItem("vstep_logged_in", "true");
  });

  const isLoggedIn = () => {
    return localStorage.getItem("vstep_logged_in") === "true";
  };

  const handleRegister = (exam: ExamScheduleItem) => {
    if (!isLoggedIn()) {
      // Redirect to auth page
      window.location.href = "/auth";
      return;
    }
    setQrExam(exam);
    setPaymentSuccess(false);
    setQrDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải lịch thi...</p>
        </div>
      </div>
    );
  }

  const simulatePayment = () => {
    setPaymentSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
          <span className="font-bold text-foreground">Lịch thi VSTEP</span>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Lịch thi <span className="text-gradient">VSTEP</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Thông tin lịch thi, địa điểm, lệ phí tham khảo và hướng dẫn đăng ký thi VSTEP trên toàn quốc.
          </p>
        </div>

        {/* Exam fee reference */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <DollarSign size={22} className="text-primary" /> Lệ phí thi tham khảo
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="border-border">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-foreground">Viên chức, người lao động & học viên, sinh viên, học sinh thuộc ĐHQG-HCM</h3>
                <p className="text-2xl font-extrabold text-foreground">1.500.000đ <span className="text-sm font-normal text-muted-foreground">/ hồ sơ</span></p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-primary">•</span>Giảm thêm <strong>10%</strong> lệ phí cho nhóm đăng ký từ 3 người trở lên</li>
                  <li className="flex items-start gap-2"><span className="text-primary">•</span>Đối với nhóm sinh viên USSH: giảm <strong>15%</strong> lệ phí cho nhóm từ 3 người trở lên</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-foreground">Học viên, sinh viên, học sinh ngoài ĐHQG-HCM</h3>
                <p className="text-2xl font-extrabold text-foreground">1.600.000đ <span className="text-sm font-normal text-muted-foreground">/ hồ sơ</span></p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-primary">•</span>Giảm thêm <strong>10%</strong> lệ phí cho nhóm đăng ký từ 3 người trở lên</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Exam info cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, label: "Thời gian thi", value: "~172 phút", desc: "Listening + Reading + Writing + Speaking" },
            { icon: Users, label: "Giá trị chứng chỉ", value: "2 năm", desc: "Kể từ ngày cấp" },
            { icon: FileText, label: "Kỹ năng", value: "4 kỹ năng", desc: "Nghe, Đọc, Viết, Nói" },
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
            {schedule.map((exam, i) => (
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
                    <Button size="sm" className="w-full gradient-primary text-primary-foreground mt-2" onClick={() => handleRegister(exam)}>
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
            {centerList.map((center) => (
              <Card key={center.name} className="border-border">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-foreground text-sm">{center.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2"><MapPin size={14} className="shrink-0 mt-0.5" /><span>{center.address}</span></div>
                    <div className="flex items-center gap-2"><Phone size={14} className="shrink-0" /><span>{center.phone}</span></div>
                    <div className="flex items-center gap-2"><Mail size={14} className="shrink-0" /><span>{center.email}</span></div>
                    <div className="flex items-center gap-2"><Globe size={14} className="shrink-0" />
                      <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Website</a>
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

      {/* QR Payment Dialog */}
      <Dialog open={qrDialog} onOpenChange={setQrDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paymentSuccess ? <CheckCircle2 size={20} className="text-emerald-600" /> : <QrCode size={20} className="text-primary" />}
              {paymentSuccess ? "Đăng ký thành công!" : "Thanh toán lệ phí thi"}
            </DialogTitle>
          </DialogHeader>

          {paymentSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Chuyển khoản thành công!</h3>
                <p className="text-sm text-muted-foreground mt-1">Đăng ký thi VSTEP của bạn đã được xác nhận.</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ngày thi:</span>
                  <span className="font-medium text-foreground">{qrExam?.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Địa điểm:</span>
                  <span className="font-medium text-foreground">{qrExam?.location}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số tiền:</span>
                  <span className="font-medium text-foreground">1.500.000đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã GD:</span>
                  <span className="font-medium text-primary">VSTEP{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Đã thanh toán</Badge>
                </div>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => setQrDialog(false)}>Đóng</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày thi:</span>
                  <span className="font-medium text-foreground">{qrExam?.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Địa điểm:</span>
                  <span className="font-medium text-foreground">{qrExam?.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lệ phí:</span>
                  <span className="font-bold text-foreground">1.500.000đ</span>
                </div>
              </div>

              {/* Fake QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-48 h-48 bg-card border-2 border-border rounded-xl flex items-center justify-center relative">
                  {/* Simulated QR pattern */}
                  <div className="grid grid-cols-7 gap-0.5 p-3">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-sm ${[0,1,2,3,4,5,6,7,8,12,13,14,20,21,27,28,34,35,36,40,41,42,43,44,45,46,47,48].includes(i) ? "bg-foreground" : Math.random() > 0.5 ? "bg-foreground" : "bg-transparent"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">Quét mã QR bằng ứng dụng ngân hàng để thanh toán</p>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Ngân hàng: <strong className="text-foreground">Vietcombank</strong></p>
                  <p className="text-xs text-muted-foreground">STK: <strong className="text-foreground">1234 5678 9012</strong></p>
                  <p className="text-xs text-muted-foreground">Nội dung: <strong className="text-primary">VSTEP {qrExam?.date?.replace(/\//g, "")}</strong></p>
                </div>
              </div>

              <Button className="w-full gradient-primary text-primary-foreground" onClick={simulatePayment}>
                Xác nhận đã chuyển khoản
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setQrDialog(false)}>Hủy</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VstepRegistration;
