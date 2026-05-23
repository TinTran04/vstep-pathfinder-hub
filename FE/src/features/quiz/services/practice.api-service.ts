// src/features/quiz/services/practice.api-service.ts
// ============================================================
// Practice API Service — dùng chung cho Listening và Reading.
//
// Endpoints:
//   POST /api/{skill}-practice/{examId}/start
//     → StartPracticeResponse  (có attemptId + exam detail)
//
//   POST /api/{skill}-practice/{attemptId}/submit
//     → SubmitPracticeResponse (score, correctCount, totalQuestions)
//
//   GET  /api/{skill}-practice/attempts/{attemptId}/result
//     → AttemptResultResponse
//
// "skill" = "listening" | "reading"
// ============================================================

import { apiClient } from "@/services/api-client";
import type {
  ExamDetailResponse,
  SectionResponse,
  QuestionResponse,
  OptionResponse,
} from "./exam.service";

// ─── Re-export exam shapes for convenience ───────────────────
export type { ExamDetailResponse, SectionResponse, QuestionResponse, OptionResponse };

// ─── BE Response types ────────────────────────────────────────

export interface StartPracticeResponse {
  attemptId: string;
  examId: string;
  skillType: string;
  status: string;
  startedAt: string;
  exam: ExamDetailResponse;
}

export interface SubmitAnswerPayload {
  questionId: string; // GUID string
  userAnswer: string; // Label of chosen option e.g. "A", "B", or free text
}

export interface SubmitPracticeResponse {
  attemptId: string;
  status: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  submittedAt: string | null;
}

export interface AttemptAnswerResponse {
  answerId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
}

export interface AttemptResultResponse {
  attemptId: string;
  examId: string;
  skillType: string;
  status: string;
  score: number | null;
  totalQuestions: number | null;
  correctCount: number | null;
  durationUsedSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
  answers: AttemptAnswerResponse[];
}

// ─── Service ─────────────────────────────────────────────────

type PracticeSkill = "listening" | "reading";

export const practiceApiService = {
  /**
   * Bắt đầu một bài luyện tập.
   * BE tạo attempt và trả về toàn bộ đề thi (questions + options).
   */
  async start(
    skill: PracticeSkill,
    examId: string
  ): Promise<StartPracticeResponse> {
    return apiClient.post<StartPracticeResponse>(
      `/${skill}-practice/${examId}/start`
    );
  },

  /**
   * Nộp bài luyện tập.
   * @param answers Map<questionId(GUID), userAnswer(string label e.g. "A")>
   */
  async submit(
    skill: PracticeSkill,
    attemptId: string,
    answers: Record<string, string>,
    durationUsedSeconds: number
  ): Promise<SubmitPracticeResponse> {
    const payload = {
      durationUsedSeconds,
      answers: Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer,
      })),
    };
    return apiClient.post<SubmitPracticeResponse>(
      `/${skill}-practice/${attemptId}/submit`,
      payload
    );
  },

  /**
   * Lấy kết quả chi tiết sau khi nộp.
   */
  async getResult(
    skill: PracticeSkill,
    attemptId: string
  ): Promise<AttemptResultResponse> {
    return apiClient.get<AttemptResultResponse>(
      `/${skill}-practice/attempts/${attemptId}/result`
    );
  },
};

export default practiceApiService;
