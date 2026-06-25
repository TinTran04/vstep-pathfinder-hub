// src/features/quiz/speaking/services/speaking.api-service.ts
// ============================================================
// Speaking Practice API Service
//
// Flow:
//  1. POST /api/speaking-practice/{examId}/upload (multipart/form-data)
//       body: audio file
//       → { uploadUrl (objectUrl), audioObjectKey, expiresAt }
//
//  2. POST /api/speaking-practice/{examId}/submit
//       body: { audioObjectKey, audioUrl }
//       → 202 Accepted: SpeakingSubmissionResponse
//
//  3. GET  /api/speaking-practice/submissions/{submissionId}
//       Poll until status === "scored" / "graded"
// ============================================================

import { apiClient } from "@/services/api-client";

// ─── Request / Response types ────────────────────────────────

export interface CreateSpeakingUploadUrlRequest {
  examId: number;       // BE expects int
  contentType: string; // e.g. "audio/webm"
}

export interface SpeakingUploadUrlResponse {
  uploadUrl: string;
  audioObjectKey: string;
  contentType: string;
  expiresAt: string;
}

export interface SubmitSpeakingRequest {
  audioObjectKey: string;
  audioUrl: string;
}

export interface SpeakingSubmissionResponse {
  speakingSubmissionId: number;  // BE returns int
  userId: number;
  examId: number;
  attemptId: number | null;
  audioObjectKey: string;
  audioUrl: string;
  status: string; // "pending" | "processing" | "scored" | "graded" | "failed"
  score: number | null;
  feedback: string | null;
  feedbackJson?: string | null;
  transcript?: string | null;
  fluency?: number | null;
  pronunciation?: number | null;
  grammar?: number | null;
  vocabulary?: number | null;
  topicDevelopment?: number | null;
  relevance?: number | null; // backward compat
  feedbackPoints?: string[];
  autoDeleteAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export type SpeakingResultResponse = SpeakingSubmissionResponse;

// ─── Service ─────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 5 * 60 * 1000; // 5 minutes

export const speakingApiService = {
  /**
   * Proxy upload qua backend thay vi frontend upload truc tiep len R2.
   */
  async uploadAudio(examId: number, blob: Blob): Promise<SpeakingUploadUrlResponse> {
    const formData = new FormData();
    formData.append("audio", blob, "speaking.webm");

    return apiClient.upload<SpeakingUploadUrlResponse>(
      `/speaking-practice/${examId}/upload`,
      formData
    );
  },

  /**
   * Bước 3: Nộp metadata bài Speaking và đưa vào hàng đợi chấm điểm AI.
   */
  async submit(
    examId: number,
    audioObjectKey: string,
    audioUrl: string
  ): Promise<SpeakingSubmissionResponse> {
    const body: SubmitSpeakingRequest = { audioObjectKey, audioUrl };
    return apiClient.post<SpeakingSubmissionResponse>(
      `/speaking-practice/${examId}/submit`,
      body
    );
  },

  /**
   * Lấy kết quả một lần (GET).
   */
  async getSubmission(submissionId: number): Promise<SpeakingResultResponse> {
    return apiClient.get<SpeakingResultResponse>(
      `/speaking-practice/submissions/${submissionId}`
    );
  },

  /**
   * Bước 4: Poll cho đến khi status === "scored" | "graded" | "failed" hoặc timeout.
   */
  async pollUntilGraded(
    submissionId: number,
    onStatusChange?: (status: string) => void
  ): Promise<SpeakingResultResponse> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const result = await this.getSubmission(submissionId);
      onStatusChange?.(result.status);

      if (result.status === "scored" || result.status === "graded" || result.status === "failed") {
        return result;
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    throw new Error("Speaking grading timed out after 5 minutes.");
  },

  /**
   * Helper: Thực hiện toàn bộ flow upload cho một file audio.
   * Trả về { audioObjectKey, audioUrl, submissionId } sau khi submit thành công.
   */
  async uploadAndSubmit(
    examId: number,
    blob: Blob,
    contentType = "audio/webm"
  ): Promise<{ audioObjectKey: string; audioUrl: string; submissionId: number }> {
    // 1. Upload via proxy backend
    const { uploadUrl: audioUrl, audioObjectKey } = await this.uploadAudio(examId, blob);

    // 2. Submit metadata
    const submission = await this.submit(examId, audioObjectKey, audioUrl);

    return {
      audioObjectKey,
      audioUrl,
      submissionId: submission.speakingSubmissionId,
    };
  },
};

export default speakingApiService;
