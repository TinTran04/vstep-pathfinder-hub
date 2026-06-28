// src/features/attempts/services/attempt-review.api-service.ts

import { apiClient } from "@/services/api-client";
import type { AttemptReviewResponse } from "../types";

export const attemptReviewApiService = {
  async getAttemptReview(attemptId: number | string): Promise<AttemptReviewResponse> {
    return await apiClient.get<AttemptReviewResponse>(`/attempts/${attemptId}/review`);
  },
};
