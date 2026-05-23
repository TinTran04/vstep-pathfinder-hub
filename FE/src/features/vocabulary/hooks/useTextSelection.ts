// src/features/vocabulary/hooks/useTextSelection.ts
import { useState, useCallback, useEffect } from "react";

export interface TextSelectionInfo {
  text: string;
  rect: DOMRect | null;
}

export interface UseTextSelectionReturn {
  selection: TextSelectionInfo | null;
  clearSelection: () => void;
}

/** Validates that the selected text is a meaningful word/phrase (not too long, not only symbols/numbers) */
function isValidSelection(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const trimmed = text.trim();
  // Max 60 chars
  if (trimmed.length > 60) return false;
  // Max 5 words
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount > 5) return false;
  // Must contain at least one letter
  if (!/[a-zA-ZÀ-ỹ]/.test(trimmed)) return false;
  return true;
}

export function useTextSelection(): UseTextSelectionReturn {
  const [selection, setSelection] = useState<TextSelectionInfo | null>(null);

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection(null);
      return;
    }
    const text = sel.toString();
    if (!isValidSelection(text)) {
      setSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelection({ text: text.trim(), rect });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  return { selection, clearSelection };
}
