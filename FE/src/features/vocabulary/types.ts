// src/features/vocabulary/types.ts

export type VocabularySource =
  | "listening"
  | "reading"
  | "writing"
  | "speaking"
  | "review"
  | "writing_sample"
  | "unknown";

export interface SavedVocabulary {
  id: string;
  userId?: string;
  word: string;
  normalizedWord: string;
  meaningVi: string;
  phonetic?: string;
  partOfSpeech?: string;
  example?: string;
  audioUrl?: string;
  source: VocabularySource;
  sourceText?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveVocabularyPayload {
  word: string;
  source?: VocabularySource;
  sourceText?: string;
  sourceUrl?: string;
}
