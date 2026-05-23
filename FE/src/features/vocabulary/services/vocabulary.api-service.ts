// src/features/vocabulary/services/vocabulary.api-service.ts
// API-ready service — used when VITE_DATA_SOURCE=api
import { apiClient } from "@/services/api-client";
import type { SavedVocabulary, SaveVocabularyPayload } from "../types";

export const vocabularyApiService = {
  async getSavedVocabulary(): Promise<SavedVocabulary[]> {
    const res = await apiClient.get<{ success: boolean; data: SavedVocabulary[] }>(
      "/api/v1/vocabulary"
    );
    return res.data;
  },

  async saveVocabulary(payload: SaveVocabularyPayload): Promise<SavedVocabulary> {
    const res = await apiClient.post<{ success: boolean; data: SavedVocabulary }>(
      "/api/v1/vocabulary",
      payload
    );
    return res.data;
  },

  async deleteVocabulary(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`/api/v1/vocabulary/${id}`);
  },

  async isVocabularySaved(normalizedWord: string): Promise<boolean> {
    const list = await vocabularyApiService.getSavedVocabulary();
    return list.some((v) => v.normalizedWord === normalizedWord);
  },

  async clearVocabulary(): Promise<void> {
    const list = await vocabularyApiService.getSavedVocabulary();
    await Promise.all(list.map((v) => vocabularyApiService.deleteVocabulary(v.id)));
  },
};
