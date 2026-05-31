// src/features/quiz/listening/services/listening.service.ts
// ============================================================
// Listening Service — gọi API thật tới:
//   POST /api/listening-practice/{examId}/start
//   POST /api/listening-practice/{attemptId}/submit
//   GET  /api/listening-practice/attempts/{attemptId}/result
// ============================================================

import { practiceApiService } from "@/features/quiz/services/practice.api-service";
import type {
  StartPracticeResponse,
  SubmitPracticeResponse,
  AttemptResultResponse,
} from "@/features/quiz/services/practice.api-service";

export type { StartPracticeResponse, SubmitPracticeResponse, AttemptResultResponse };

export const listeningService = {
  async start(examId: number): Promise<StartPracticeResponse> {
    return practiceApiService.start("listening", examId);
  },

  async submit(
    attemptId: number,
    answers: Record<number, string>,
    durationUsedSeconds: number
  ): Promise<SubmitPracticeResponse> {
    return practiceApiService.submit("listening", attemptId, answers, durationUsedSeconds);
  },

  async getResult(attemptId: number): Promise<AttemptResultResponse> {
    return practiceApiService.getResult("listening", attemptId);
  },
};

export default listeningService;
