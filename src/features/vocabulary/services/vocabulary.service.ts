// src/features/vocabulary/services/vocabulary.service.ts
import { isMockDataSource } from "@/services/data-source";
import { vocabularyMockService } from "./vocabulary.mock-service";
import { vocabularyApiService } from "./vocabulary.api-service";

export const vocabularyService = isMockDataSource
  ? vocabularyMockService
  : vocabularyApiService;
