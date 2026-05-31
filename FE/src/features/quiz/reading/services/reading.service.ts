// src/features/quiz/reading/services/reading.service.ts
import { practiceApiService } from "@/features/quiz/services/practice.api-service";
import type {
  StartPracticeResponse,
  SubmitPracticeResponse,
  AttemptResultResponse,
} from "@/features/quiz/services/practice.api-service";

export type { StartPracticeResponse, SubmitPracticeResponse, AttemptResultResponse };

export const readingService = {
  async start(examId: number): Promise<StartPracticeResponse> {
    return practiceApiService.start("reading", examId);
  },

  async submit(
    attemptId: number,
    answers: Record<number, string>,
    durationUsedSeconds: number
  ): Promise<SubmitPracticeResponse> {
    return practiceApiService.submit("reading", attemptId, answers, durationUsedSeconds);
  },

  async getResult(attemptId: number): Promise<AttemptResultResponse> {
    return practiceApiService.getResult("reading", attemptId);
  },
};

export default readingService;
