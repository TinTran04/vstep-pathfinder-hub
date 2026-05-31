// src/features/quiz/speaking/services/speaking.api-service.ts
// ============================================================
// Speaking Practice API Service
//
// Flow:
//  1. POST /api/speaking-practice/upload-url
//       body: { examId, contentType }
//       → { uploadUrl, audioObjectKey, expiresAt }
//
//  2. PUT <uploadUrl>  (direct upload to Cloudflare R2 — no auth header)
//
//  3. POST /api/speaking-practice/{examId}/submit
//       body: { audioObjectKey, audioUrl }
//       → 202 Accepted: SpeakingSubmissionResponse
//
//  4. GET  /api/speaking-practice/submissions/{submissionId}
//       Poll until status === "graded"
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
  status: string; // "pending" | "processing" | "graded" | "failed"
  score: number | null;
  feedback: string | null;
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
   * Bước 1: Lấy presigned URL để upload audio lên R2.
   */
  async createUploadUrl(
    examId: number,
    contentType = "audio/webm"
  ): Promise<SpeakingUploadUrlResponse> {
    const body: CreateSpeakingUploadUrlRequest = { examId, contentType };
    return apiClient.post<SpeakingUploadUrlResponse>(
      "/speaking-practice/upload-url",
      body
    );
  },

  /**
   * Bước 2: Upload trực tiếp file audio lên Cloudflare R2 bằng presigned URL.
   * Không dùng apiClient vì URL này là external, không cần auth header.
   */
  async uploadToR2(uploadUrl: string, blob: Blob, contentType = "audio/webm"): Promise<string> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    if (!res.ok) {
      throw new Error(`R2 upload failed: HTTP ${res.status} ${res.statusText}`);
    }

    // Public URL = uploadUrl stripped of query string (presigned params)
    return uploadUrl.split("?")[0];
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
   * Bước 4: Poll cho đến khi status === "graded" | "failed" hoặc timeout.
   */
  async pollUntilGraded(
    submissionId: number,
    onStatusChange?: (status: string) => void
  ): Promise<SpeakingResultResponse> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const result = await this.getSubmission(submissionId);
      onStatusChange?.(result.status);

      if (result.status === "graded" || result.status === "failed") {
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
    // 1. Get presigned URL
    const { uploadUrl, audioObjectKey } = await this.createUploadUrl(examId, contentType);

    // 2. Upload to R2
    const audioUrl = await this.uploadToR2(uploadUrl, blob, contentType);

    // 3. Submit metadata
    const submission = await this.submit(examId, audioObjectKey, audioUrl);

    return {
      audioObjectKey,
      audioUrl,
      submissionId: submission.speakingSubmissionId,
    };
  },
};

export default speakingApiService;
