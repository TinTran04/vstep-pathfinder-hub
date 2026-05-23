// src/features/attempts/services/attempts.api-service.ts
// ============================================================
// API implementation of AttemptsService.
// Used when VITE_DATA_SOURCE=api.
//
// All calls map 1:1 to the endpoints defined in docs/API_CONTRACT.md.
// Components do NOT need to change — they import from attempts.service.ts.
// ============================================================

import { apiClient } from "@/services/api-client";
import type { MockTestAttempt, Skill, SkillAttempt } from "../types";

// ----------------------------------------------------------------
// Helper — shape of the API skill update payload
// ----------------------------------------------------------------

type SkillPayload = Omit<SkillAttempt, "skill"> & { skill: Skill };

// ----------------------------------------------------------------
// API service implementation
// ----------------------------------------------------------------

export const attemptsApiService = {
  /**
   * POST /api/v1/attempts/start
   * Initializes a new attempt (practice or mock_test).
   */
  async startAttempt(mode: "practice" | "mock_test" = "mock_test"): Promise<MockTestAttempt> {
    return apiClient.post<MockTestAttempt>("/attempts/start", { mode });
  },

  /** @deprecated Legacy alias. Use startAttempt(). */
  async startMockTest(): Promise<MockTestAttempt> {
    return this.startAttempt("mock_test");
  },

  /**
   * PATCH /api/v1/attempts/:attemptId/skill
   * Saves answers/progress for a single skill inside an existing attempt.
   */
  async saveSkillAttempt(
    skill: Skill,
    data: Omit<SkillAttempt, "skill">
  ): Promise<MockTestAttempt> {
    // The current attemptId is stored in sessionStorage so we don't need to pass it explicitly
    // from the calling component.
    let attemptId = sessionStorage.getItem("vstep_current_attempt_id");
    if (!attemptId) {
      // Auto-start a practice session if none exists (prevents crashes in direct practice mode)
      console.log("[api-service] No active attemptId found in sessionStorage. Auto-starting a practice attempt...");
      const newAttempt = await this.startAttempt("practice");
      attemptId = newAttempt.id;
      sessionStorage.setItem("vstep_current_attempt_id", attemptId);
    }
    const payload: SkillPayload = { ...data, skill };
    return apiClient.patch<MockTestAttempt>(`/attempts/${attemptId}/skill`, payload);
  },

  /** GET the current attempt from sessionStorage key */
  async getCurrentAttempt(): Promise<MockTestAttempt | null> {
    const id = sessionStorage.getItem("vstep_current_attempt_id");
    if (!id) return null;
    return this.getAttemptById(id);
  },

  /**
   * POST /api/v1/attempts/:attemptId/finish
   * Finalizes the attempt, computes overall score, band level, and analysis.
   */
  async finishMockTest(): Promise<MockTestAttempt | null> {
    const id = sessionStorage.getItem("vstep_current_attempt_id");
    if (!id) return null;
    const result = await apiClient.post<MockTestAttempt>(`/attempts/${id}/finish`, {});
    sessionStorage.removeItem("vstep_current_attempt_id");
    return result;
  },

  /**
   * GET /api/v1/attempts/:attemptId
   * Retrieves full attempt details (supports session recovery after F5).
   */
  async getAttemptById(id: string): Promise<MockTestAttempt | null> {
    try {
      return await apiClient.get<MockTestAttempt>(`/attempts/${id}`);
    } catch {
      return null;
    }
  },

  /**
   * Convenience method — returns the most-recently-started attempt of the user.
   * (There is no direct "last attempt" endpoint; we use the result endpoint with
   *  the ID stored in sessionStorage as a best-effort fallback.)
   */
  async getLastAttempt(): Promise<MockTestAttempt | null> {
    const id = sessionStorage.getItem("vstep_current_attempt_id");
    if (!id) return null;
    return this.getAttemptById(id);
  },

  /**
   * GET /api/v1/attempts/:attemptId/result
   * Fetches the aggregated result (score, level, strengths, weaknesses).
   */
  async getAttemptResult(id: string): Promise<MockTestAttempt | null> {
    try {
      return await apiClient.get<MockTestAttempt>(`/attempts/${id}/result`);
    } catch {
      return null;
    }
  },

  /**
   * GET /api/v1/attempts/:attemptId/review
   * Fetches the detailed answer review (correct answers, explanations, recordings).
   */
  async getAttemptReview(id: string): Promise<MockTestAttempt | null> {
    try {
      return await apiClient.get<MockTestAttempt>(`/attempts/${id}/review`);
    } catch {
      return null;
    }
  },

  /**
   * POST /api/v1/attempts/:attemptId/speaking/upload
   * Uploads a Speaking audio blob and returns the permanent cloud storage URL.
   */
  async uploadSpeakingRecording(
    attemptId: string,
    partId: number,
    blob: Blob
  ): Promise<string> {
    const formData = new FormData();
    formData.append("partId", String(partId));
    formData.append("audio", blob, `speaking-part-${partId}.webm`);
    const result = await apiClient.upload<{ audioUrl: string }>(
      `/attempts/${attemptId}/speaking/upload`,
      formData
    );
    return result.audioUrl;
  },

  /**
   * POST /api/v1/attempts/:attemptId/writing/submit
   * Submits Writing essays for AI grading.
   */
  async submitWriting(
    attemptId: string,
    writings: Record<number, string>
  ): Promise<void> {
    await apiClient.post(`/attempts/${attemptId}/writing/submit`, { writings });
  },

  clearAttempt(): void {
    sessionStorage.removeItem("vstep_current_attempt_id");
  },
};

export default attemptsApiService;
