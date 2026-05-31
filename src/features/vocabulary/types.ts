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
  
  // Backend-specific fields (UserVocabularyResponse)
  userVocabularyId?: number;
  dictionaryEntryId?: number;
  englishDefinition?: string;
  exampleVietnamese?: string;
  personalNote?: string;
  isFavorite?: boolean;
  reviewCount?: number;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
}

export interface SaveVocabularyPayload {
  word: string;
  source?: VocabularySource;
  sourceText?: string;
  sourceUrl?: string;
}
