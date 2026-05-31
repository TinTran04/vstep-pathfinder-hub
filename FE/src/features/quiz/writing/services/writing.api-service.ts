// src/features/quiz/writing/services/writing.api-service.ts
// ============================================================
// Writing Practice API Service
//
// Endpoints:
//   POST /api/writing-practice/{examId}/submit
//     body: { prompt, essayText }
//     → 202 Accepted: WritingSubmissionResponse  (submissionId + status)
//
//   GET /api/writing-practice/submissions/{submissionId}
//     → WritingResultResponse (score, feedback, status)
//     Poll until status === "scored" / "graded"
// ============================================================

import { apiClient } from "@/services/api-client";
import type { ExamResponse } from "@/features/quiz/services/exam.service";

// ─── Request / Response types ────────────────────────────────

export interface SubmitWritingRequest {
  prompt: string;
  essayText: string;
}

export interface WritingSubmissionResponse {
  writingSubmissionId: number;  // BE returns int
  userId: number;
  examId: number;
  attemptId: number | null;
  prompt: string;
  status: string; // "pending" | "processing" | "scored" | "graded" | "failed"
  score: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export type WritingResultResponse = WritingSubmissionResponse;

export interface WritingExamDetail {
  exam: ExamResponse;
}

// ─── Service ─────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 5 * 60 * 1000; // 5 minutes

export const writingApiService = {
  /**
   * Nộp bài viết lên BE để chấm điểm bất đồng bộ bằng AI.
   * Trả về submissionId ngay lập tức (202 Accepted).
   */
  async submit(
    examId: number,
    prompt: string,
    essayText: string
  ): Promise<WritingSubmissionResponse> {
    const body: SubmitWritingRequest = { prompt, essayText };
    return apiClient.post<WritingSubmissionResponse>(
      `/writing-practice/${examId}/submit`,
      body
    );
  },

  /**
   * Lấy kết quả một lần (GET).
   */
  async getSubmission(submissionId: number): Promise<WritingResultResponse> {
    return apiClient.get<WritingResultResponse>(
      `/writing-practice/submissions/${submissionId}`
    );
  },

  /**
   * Poll cho đến khi status === "graded" | "failed" hoặc timeout.
   * Gọi onStatusChange(status) mỗi khi có cập nhật mới.
   */
  async pollUntilGraded(
    submissionId: number,
    onStatusChange?: (status: string) => void
  ): Promise<WritingResultResponse> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const result = await this.getSubmission(submissionId);
      onStatusChange?.(result.status);

      if (result.status === "scored" || result.status === "graded" || result.status === "failed") {
        return result;
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    throw new Error("Writing grading timed out after 5 minutes.");
  },
};

export default writingApiService;
