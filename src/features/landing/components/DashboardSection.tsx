import { TrendingUp, BookOpen, Target, Zap } from "lucide-react";

const stats = [
  { label: "Bài đã hoàn thành", value: "24/36", icon: BookOpen, color: "text-blue-600 bg-blue-500/10" },
  { label: "Điểm trung bình", value: "7.5", icon: Target, color: "text-emerald-600 bg-emerald-500/10" },
  { label: "Chuỗi ngày học", value: "12 ngày", icon: Zap, color: "text-amber-600 bg-amber-500/10" },
  { label: "Tiến bộ tuần này", value: "+15%", icon: TrendingUp, color: "text-rose-600 bg-rose-500/10" },
];

const recentScores = [
  { name: "Listening Test 5", score: 8.0, date: "Hôm nay" },
  { name: "Reading Practice 12", score: 7.5, date: "Hôm qua" },
  { name: "Full Test 3", score: 7.0, date: "3 ngày trước" },
];

const DashboardSection = () => {
  return (
    <section className="section-padding section-alt">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Theo dõi tiến độ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Dashboard học tập thông minh
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Nắm rõ tiến bộ của bạn qua biểu đồ trực quan và gợi ý bài học phù hợp.
          </p>
        </div>

        {/* Mockup dashboard */}
        <div className="card-edu p-6 md:p-8 max-w-4xl mx-auto">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/50 p-4">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon size={20} />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Tiến độ tổng thể</span>
              <span className="text-sm font-bold text-primary">67%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full gradient-primary w-[67%] transition-all duration-1000" />
            </div>
          </div>

          {/* Recent scores */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Điểm gần đây</h4>
            <div className="space-y-2">
              {recentScores.map((r) => (
                <div key={r.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.date}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">{r.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestion */}
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm font-medium text-foreground">💡 Gợi ý bài học tiếp theo</p>
            <p className="text-sm text-muted-foreground mt-1">Listening Practice 6 — Bạn nên cải thiện kỹ năng nghe chi tiết.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
