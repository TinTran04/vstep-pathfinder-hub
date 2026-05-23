// src/features/vocabulary/components/VocabularyContextMenu.tsx
import { useEffect, useRef, useCallback } from "react";
import { BookMarked } from "lucide-react";
import { toast } from "sonner";
import { useTextSelection } from "../hooks/useTextSelection";
import { useVocabularyContextMenu } from "../hooks/useVocabularyContextMenu";
import { vocabularyService } from "../services/vocabulary.service";
import type { VocabularySource } from "../types";

interface Props {
  source?: VocabularySource;
  children: React.ReactNode;
}

/** 
 * Wrap any reading/review section with this component.
 * On right-click with a valid selection → shows "Lưu vào sổ từ" menu.
 */
const VocabularyContextMenu = ({ source = "unknown", children }: Props) => {
  const { selection, clearSelection } = useTextSelection();
  const { menuPos, selectedText, openMenu, closeMenu } = useVocabularyContextMenu();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Don't intercept if right-clicking inside interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("a") ||
        target.closest('[role="menu"]')
      ) {
        return;
      }

      if (selection && selection.text) {
        e.preventDefault();
        openMenu({ x: e.clientX, y: e.clientY }, selection.text);
      }
    },
    [selection, openMenu]
  );

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    if (menuPos) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuPos, closeMenu]);

  // Close menu on scroll
  useEffect(() => {
    if (!menuPos) return;
    const handleScroll = () => closeMenu();
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [menuPos, closeMenu]);

  const handleSave = async () => {
    closeMenu();
    clearSelection();
    try {
      const existing = await vocabularyService.isVocabularySaved(
        selectedText.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "").replace(/\s+/g, " ")
      );
      await vocabularyService.saveVocabulary({
        word: selectedText,
        source,
        sourceUrl: window.location.pathname,
      });
      if (existing) {
        toast.info(`"${selectedText}" đã có trong Sổ tay từ vựng`, {
          description: "Đã cập nhật thông tin nguồn.",
        });
      } else {
        toast.success(`Đã lưu "${selectedText}" vào Sổ tay từ vựng 📖`);
      }
    } catch {
      toast.error("Không thể lưu từ. Vui lòng thử lại.");
    }
  };

  return (
    <div ref={containerRef} onContextMenu={handleContextMenu} className="relative">
      {children}

      {menuPos && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: "fixed",
            top: Math.min(menuPos.y, window.innerHeight - 100),
            left: Math.min(menuPos.x, window.innerWidth - 240),
            zIndex: 9999,
          }}
          className="bg-card border border-border rounded-xl shadow-xl min-w-[220px] py-1 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs text-muted-foreground">Từ đã chọn</p>
            <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">
              "{selectedText}"
            </p>
          </div>
          <button
            role="menuitem"
            onClick={handleSave}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <BookMarked size={15} className="text-primary shrink-0" />
            Lưu vào Sổ tay từ vựng
          </button>
        </div>
      )}
    </div>
  );
};

export default VocabularyContextMenu;
