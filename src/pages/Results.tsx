import { Link } from "react-router-dom";
import { ArrowLeft, Star, Award, TrendingUp, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const topStudents = [
  { name: "Nguyễn Minh Anh", avatar: "MA", score: "8.5", level: "C1", role: "Sinh viên năm cuối – ĐH Ngoại thương", improvement: "+2.5 bậc sau 3 tháng" },
  { name: "Trần Văn Hùng", avatar: "VH", score: "7.0", level: "B2", role: "Nhân viên văn phòng", improvement: "+2.0 bậc sau 4 tháng" },
  { name: "Lê Thị Hương", avatar: "TH", score: "7.5", level: "B2", role: "Sinh viên năm 4 – ĐH Sư phạm", improvement: "+1.5 bậc sau 2 tháng" },
  { name: "Phạm Đức Minh", avatar: "ĐM", score: "9.0", level: "C1", role: "Giảng viên tiếng Anh", improvement: "+1.0 bậc sau 2 tháng" },
  { name: "Hoàng Thị Lan", avatar: "TL", score: "6.5", level: "B1", role: "Sinh viên năm cuối – ĐH Bách khoa", improvement: "+2.0 bậc sau 3 tháng" },
  { name: "Đỗ Quang Khải", avatar: "QK", score: "8.0", level: "B2", role: "Kỹ sư phần mềm", improvement: "+1.5 bậc sau 3 tháng" },
];

const testimonials = [
  {
    name: "Nguyễn Minh Anh",
    avatar: "MA",
    role: "Sinh viên năm cuối – ĐH Ngoại thương",
    content: "Nhờ VSTEPPro mà mình đạt C1 ngay lần thi đầu tiên. Hệ thống luyện đề mô phỏng rất sát thực tế, đặc biệt phần Listening và Reading. Mình rất recommend cho bạn nào cần chuẩn đầu ra!",
    rating: 5,
    result: "C1 – 8.5 điểm",
  },
  {
    name: "Trần Văn Hùng",
    avatar: "VH",
    role: "Nhân viên văn phòng",
    content: "Ban đầu mình chỉ ở mức A2, sau 4 tháng học trên VSTEPPro mình đã đạt B2. Lộ trình học rõ ràng, theo dõi tiến độ dễ dàng. Rất phù hợp cho người đi làm bận rộn.",
    rating: 5,
    result: "B2 – 7.0 điểm",
  },
  {
    name: "Lê Thị Hương",
    avatar: "TH",
    role: "Sinh viên năm 4 – ĐH Sư phạm",
    content: "Phần Writing và Speaking trên VSTEPPro giúp mình cải thiện rất nhiều. Đề thi mô phỏng giống y như thi thật, mình tự tin hơn rất nhiều khi vào phòng thi.",
    rating: 4,
    result: "B2 – 7.5 điểm",
  },
];

const stats = [
  { label: "Học viên đạt B2+", value: "85%", icon: Award },
  { label: "Điểm trung bình cải thiện", value: "+2.0", icon: TrendingUp },
  { label: "Tỷ lệ hài lòng", value: "96%", icon: Star },
];

const skillStats = [
  { skill: "Listening", avg: 7.2, max: 9.5 },
  { skill: "Reading", avg: 7.0, max: 9.0 },
  { skill: "Writing", avg: 6.5, max: 8.5 },
  { skill: "Speaking", avg: 6.8, max: 9.0 },
];

const Results = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
          <span className="font-bold text-foreground">Kết quả học viên</span>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Kết quả <span className="text-gradient">học viên VSTEPPro</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hàng nghìn học viên đã chinh phục VSTEP thành công cùng VSTEPPro. Đây là những con số thực tế từ cộng đồng học viên.
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <s.icon size={24} className="text-primary" />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skill averages */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Điểm trung bình theo kỹ năng</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {skillStats.map((s) => (
              <Card key={s.skill} className="border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{s.skill}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">TB: <span className="font-bold text-foreground">{s.avg}</span></span>
                      <span className="text-muted-foreground">Cao nhất: <span className="font-bold text-primary">{s.max}</span></span>
                    </div>
                  </div>
                  <Progress value={(s.avg / 10) * 100} className="h-2.5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top students */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Học viên tiêu biểu</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topStudents.map((student) => (
              <Card key={student.name} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {student.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.role}</p>
                    </div>
                    <Badge className="gradient-primary text-primary-foreground shrink-0">{student.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Điểm VSTEP</span>
                    <span className="font-bold text-foreground text-lg">{student.score}</span>
                  </div>
                  <p className="text-xs text-accent font-medium flex items-center gap-1">
                    <TrendingUp size={12} /> {student.improvement}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Chia sẻ từ học viên</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border">
                <CardContent className="p-6 space-y-4">
                  <Quote size={24} className="text-primary/30" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.content}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < t.rating ? "text-amber-400 fill-amber-400" : "text-border"} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-xs">{t.result}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8 space-y-4">
          <h3 className="text-xl font-bold text-foreground">Bạn cũng có thể đạt kết quả như vậy!</h3>
          <p className="text-muted-foreground">Bắt đầu hành trình chinh phục VSTEP ngay hôm nay.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild className="gradient-primary text-primary-foreground">
              <Link to="/auth">Bắt đầu học ngay</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/quiz">Thử đề miễn phí</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
