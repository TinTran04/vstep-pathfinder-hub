// src/features/vocabulary/services/vocabulary.api-service.ts
// API-ready service — used when VITE_DATA_SOURCE=api
import { apiClient } from "@/services/api-client";
import type { SavedVocabulary, SaveVocabularyPayload } from "../types";

// Define BE response types for internal use
interface UserVocabularyResponse {
  userVocabularyId: number;
  dictionaryEntryId: number;
  word: string;
  phonetic?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  englishDefinition: string;
  vietnameseMeaning: string;
  example?: string;
  exampleVietnamese?: string;
  personalNote?: string;
  isFavorite: boolean;
  reviewCount: number;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
  createdAt: string;
}

interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface DictionaryEntryResponse {
  dictionaryEntryId: number;
  word: string;
  phonetic?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  englishDefinition: string;
  vietnameseMeaning: string;
  example?: string;
  exampleVietnamese?: string;
  createdAt: string;
}

interface DictionarySearchResponse {
  entry: DictionaryEntryResponse;
  userVocabulary: UserVocabularyResponse;
  fromCache: boolean;
}

function toSavedVocabulary(item: UserVocabularyResponse): SavedVocabulary {
  return {
    id: String(item.dictionaryEntryId), // Map to dictionaryEntryId so we can unfavorite it easily via ID
    userId: undefined,
    word: item.word,
    normalizedWord: item.word.toLowerCase().trim(),
    meaningVi: item.vietnameseMeaning || item.englishDefinition || "",
    phonetic: item.phonetic,
    partOfSpeech: item.partOfSpeech,
    example: item.example,
    audioUrl: item.audioUrl,
    source: "review", // Default to review source
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
    // Store all internal properties
    userVocabularyId: item.userVocabularyId,
    dictionaryEntryId: item.dictionaryEntryId,
    englishDefinition: item.englishDefinition,
    exampleVietnamese: item.exampleVietnamese,
    personalNote: item.personalNote,
    isFavorite: item.isFavorite,
    reviewCount: item.reviewCount,
    lastReviewedAt: item.lastReviewedAt,
    nextReviewAt: item.nextReviewAt,
  };
}

export const vocabularyApiService = {
  async getSavedVocabulary(): Promise<SavedVocabulary[]> {
    // Get personal dictionary, filtered by favorite=true, using large page size to fetch all
    const res = await apiClient.get<PagedResponse<UserVocabularyResponse>>(
      "/dictionary/my-words?isFavorite=true&pageSize=100"
    );
    return (res.items ?? []).map(toSavedVocabulary);
  },

  async saveVocabulary(payload: SaveVocabularyPayload): Promise<SavedVocabulary> {
    // Search the word first (BE automatically creates the UserVocabulary record)
    const searchRes = await apiClient.post<DictionarySearchResponse>(
      "/dictionary/search",
      { word: payload.word }
    );

    // Toggle favorite = true to save it
    const toggleRes = await apiClient.put<UserVocabularyResponse>(
      "/dictionary/favorite",
      {
        dictionaryEntryId: searchRes.userVocabulary.dictionaryEntryId,
        isFavorite: true,
      }
    );

    return toSavedVocabulary(toggleRes);
  },

  async deleteVocabulary(id: string): Promise<void> {
    // Unfavorite the word using its dictionaryEntryId
    await apiClient.put<UserVocabularyResponse>("/dictionary/favorite", {
      dictionaryEntryId: Number(id),
      isFavorite: false,
    });
  },

  async isVocabularySaved(normalizedWord: string): Promise<boolean> {
    try {
      const searchRes = await apiClient.post<DictionarySearchResponse>(
        "/dictionary/search",
        { word: normalizedWord }
      );
      return !!searchRes.userVocabulary && searchRes.userVocabulary.isFavorite;
    } catch {
      return false;
    }
  },

  async clearVocabulary(): Promise<void> {
    const list = await vocabularyApiService.getSavedVocabulary();
    await Promise.all(
      list.map((v) =>
        vocabularyApiService.deleteVocabulary(v.id)
      )
    );
  },
};
