// src/features/vocabulary/hooks/useVocabularyContextMenu.ts
import { useState, useCallback } from "react";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface UseVocabularyContextMenuReturn {
  menuPos: ContextMenuPosition | null;
  selectedText: string;
  openMenu: (pos: ContextMenuPosition, text: string) => void;
  closeMenu: () => void;
}

export function useVocabularyContextMenu(): UseVocabularyContextMenuReturn {
  const [menuPos, setMenuPos] = useState<ContextMenuPosition | null>(null);
  const [selectedText, setSelectedText] = useState("");

  const openMenu = useCallback((pos: ContextMenuPosition, text: string) => {
    setMenuPos(pos);
    setSelectedText(text);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPos(null);
    setSelectedText("");
  }, []);

  return { menuPos, selectedText, openMenu, closeMenu };
}
