// src/features/dashboard/components/VocabularyNotebook.tsx
import { useState, useEffect, useCallback } from "react";
import { BookMarked, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { vocabularyService } from "@/features/vocabulary/services/vocabulary.service";
import VocabularyList from "@/features/vocabulary/components/VocabularyList";
import type { SavedVocabulary } from "@/features/vocabulary/types";

const VocabularyNotebook = () => {
  const [items, setItems] = useState<SavedVocabulary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      const data = await vocabularyService.getSavedVocabulary();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDelete = async (id: string) => {
    try {
      await vocabularyService.deleteVocabulary(id);
      setItems((prev) => prev.filter((v) => v.id !== id));
      toast.success("Đã xóa từ khỏi Sổ tay từ vựng");
    } catch {
      toast.error("Không thể xóa từ. Vui lòng thử lại.");
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    try {
      await vocabularyService.clearVocabulary();
      setItems([]);
      toast.success("Đã xóa toàn bộ từ khỏi Sổ tay");
    } catch {
      toast.error("Không thể xóa danh sách. Vui lòng thử lại.");
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookMarked size={20} className="text-primary" />
              Sổ tay từ vựng
            </CardTitle>
            {!loading && items.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {items.length} từ
              </Badge>
            )}
          </div>
          {!loading && items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
            >
              <Trash2 size={13} />
              Xóa tất cả
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Những từ bạn đã lưu khi luyện tập và thi thử
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <VocabularyList items={items} onDelete={handleDelete} />
        )}
      </CardContent>
    </Card>
  );
};

export default VocabularyNotebook;
