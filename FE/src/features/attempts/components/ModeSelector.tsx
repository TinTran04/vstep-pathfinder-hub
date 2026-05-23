import { BookOpen, Clock, GraduationCap, Headphones, Mic, Pen, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModeCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  features: string[];
  restrictions?: string[];
  selected: boolean;
  onClick: () => void;
  colorClass: string;
  badgeText: string;
}

const ModeCard = ({
  title, subtitle, icon, features, restrictions,
  selected, onClick, colorClass, badgeText,
}: ModeCardProps) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
      selected
        ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
        : "border-border hover:border-primary/30 hover:bg-muted/30"
    }`}
  >
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-foreground text-base">{title}</h3>
          <Badge variant="outline" className="text-xs">{badgeText}</Badge>
          {selected && (
            <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">✓</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
        <ul className="space-y-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-foreground">
              <span className="text-emerald-500">✓</span> {f}
            </li>
          ))}
          {restrictions?.map((r, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-destructive">✕</span> {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </button>
);

interface ModeSelectorProps {
  selectedMode: "practice" | "mock_test" | null;
  onSelect: (mode: "practice" | "mock_test") => void;
}

const ModeSelector = ({ selectedMode, onSelect }: ModeSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">Chọn chế độ làm bài</p>
      </div>

      <div className="grid gap-3">
        <ModeCard
          title="Luyện đề"
          subtitle="Luyện tập linh hoạt từng kỹ năng"
          icon={<GraduationCap size={22} className="text-emerald-600" />}
          colorClass="bg-emerald-50"
          badgeText="Practice"
          features={[
            "Tạm dừng & tiếp tục bộ đếm giờ",
            "Tua lại, tua tới audio Listening",
            "Xem đáp án đúng/sai sau khi nộp",
            "Luyện từng kỹ năng riêng lẻ",
          ]}
          selected={selectedMode === "practice"}
          onClick={() => onSelect("practice")}
        />

        <ModeCard
          title="Thi thử"
          subtitle="Bài thi đầy đủ 4 kỹ năng như thi thật"
          icon={<Shield size={22} className="text-blue-600" />}
          colorClass="bg-blue-50"
          badgeText="Mock Test"
          features={[
            "Điểm tổng hợp 4 kỹ năng",
            "Review chi tiết sau khi nộp",
            "Nghe lại Listening & Speaking",
            "Feedback AI Writing & Speaking",
          ]}
          restrictions={[
            "Không pause bộ đếm giờ",
            "Không tua audio Listening",
          ]}
          selected={selectedMode === "mock_test"}
          onClick={() => onSelect("mock_test")}
        />
      </div>

      {selectedMode === "mock_test" && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <Clock size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700 space-y-1">
              <p className="font-semibold">Thứ tự bài thi:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { icon: <Headphones size={12} />, label: "Listening (~40p)" },
                  { icon: <BookOpen size={12} />, label: "Reading (~60p)" },
                  { icon: <Pen size={12} />, label: "Writing (~60p)" },
                  { icon: <Mic size={12} />, label: "Speaking (~15p)" },
                ].map((s, i, arr) => (
                  <span key={i} className="flex items-center gap-1">
                    {s.icon} {s.label}
                    {i < arr.length - 1 && <span className="text-amber-400">→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeSelector;
