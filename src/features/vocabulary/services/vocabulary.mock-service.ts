// src/features/vocabulary/services/vocabulary.mock-service.ts
import type { SavedVocabulary, SaveVocabularyPayload } from "../types";
import { lookupWord } from "../mocks/vocabulary.mock";

const STORAGE_KEY = "vstep_vocabulary_v1";

function normalizeWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/^[^\w]+|[^\w]+$/g, "") // strip leading/trailing punctuation
    .replace(/\s+/g, " ");
}

function readStorage(): SavedVocabulary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedVocabulary[];
  } catch {
    return [];
  }
}

function writeStorage(items: SavedVocabulary[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const vocabularyMockService = {
  async getSavedVocabulary(): Promise<SavedVocabulary[]> {
    await Promise.resolve(); // async tick
    return readStorage();
  },

  async saveVocabulary(payload: SaveVocabularyPayload): Promise<SavedVocabulary> {
    await Promise.resolve();
    const items = readStorage();
    const normalized = normalizeWord(payload.word);

    const existing = items.find((v) => v.normalizedWord === normalized);
    if (existing) {
      // Update source + updatedAt if word already exists
      const updated: SavedVocabulary = {
        ...existing,
        source: payload.source ?? existing.source,
        sourceText: payload.sourceText ?? existing.sourceText,
        sourceUrl: payload.sourceUrl ?? existing.sourceUrl,
        updatedAt: new Date().toISOString(),
      };
      const next = items.map((v) => (v.id === existing.id ? updated : v));
      writeStorage(next);
      return updated;
    }

    const dict = lookupWord(normalized);
    const newItem: SavedVocabulary = {
      id: `vocab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      word: payload.word.trim(),
      normalizedWord: normalized,
      meaningVi: dict.meaningVi,
      phonetic: dict.phonetic,
      partOfSpeech: dict.partOfSpeech,
      example: dict.example,
      audioUrl: undefined,
      source: payload.source ?? "unknown",
      sourceText: payload.sourceText,
      sourceUrl: payload.sourceUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    writeStorage([newItem, ...items]);
    return newItem;
  },

  async deleteVocabulary(id: string): Promise<void> {
    await Promise.resolve();
    const items = readStorage().filter((v) => v.id !== id);
    writeStorage(items);
  },

  async isVocabularySaved(normalizedWord: string): Promise<boolean> {
    await Promise.resolve();
    const items = readStorage();
    return items.some((v) => v.normalizedWord === normalizeWord(normalizedWord));
  },

  async clearVocabulary(): Promise<void> {
    await Promise.resolve();
    localStorage.removeItem(STORAGE_KEY);
  },
};
