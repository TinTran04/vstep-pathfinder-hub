// src/features/vocabulary/components/VocabularyEmptyState.tsx
import { BookOpen } from "lucide-react";

const VocabularyEmptyState = () => (
  <div className="text-center py-12 space-y-3">
    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
      <BookOpen size={28} className="text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-foreground">Sổ tay đang trống</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
      Bạn chưa lưu từ nào. Hãy <strong>bôi đen từ</strong> ở 4 kỹ năng (Nghe, Đọc, Viết, Nói) hoặc phần xem lại rồi{" "}
      <strong>click chuột phải</strong> để lưu vào đây.
    </p>
  </div>
);

export default VocabularyEmptyState;
