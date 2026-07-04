// src/features/attempts/services/attempts.api-service.ts
// ============================================================
// API-compatible AttemptsService.
//
// Current backend does not expose aggregate /api/attempts/* endpoints.
// Skill-specific flows still use real APIs:
// - /api/reading-practice/*
// - /api/listening-practice/*
// - /api/writing-practice/*
// - /api/speaking-practice/*
//
// This service stores only the aggregate attempt summary locally so API mode
// does not call missing endpoints such as /api/attempts/start.
// ============================================================

import { apiClient } from "@/services/api-client";
import type { MockTestAttempt, Skill, SkillAttempt } from "../types";
import { attemptsMockService } from "./attempts.mock-service";

export const attemptsApiService = {
  // We keep mock service for single-skill practice since they use separate skill endpoints.
  // But for mock_test, we use the new aggregate endpoints.

  async startAttempt(mode: "practice" | "mock_test" = "mock_test"): Promise<MockTestAttempt> {
    return attemptsMockService.startAttempt(mode);
  },

  async startMockTest(examId: number): Promise<MockTestAttempt> {
    const res = await apiClient.post<any>(`/attempts/start-mock-test/${examId}`);
    return {
      id: String(res.attemptId),
      mode: "mock_test",
      status: res.status,
      startedAt: res.startedAt,
      completedAt: undefined,
      overallScore: null,
      skills: {
        listening: { status: "not_started" },
        reading: { status: "not_started" },
        writing: { status: "not_started" },
        speaking: { status: "not_started" },
      },
    };
  },

  async startRandomMockTest(): Promise<MockTestAttempt> {
    const res = await apiClient.post<any>(`/attempts/random-mock-test/start`);
    return {
      id: String(res.attemptId),
      mode: "random_mock_test" as any, // Extrapolating the type for simplicity
      status: "not_started",
      startedAt: res.startedAt,
      completedAt: undefined,
      overallScore: null,
      skills: {
        listening: { status: "not_started" },
        reading: { status: "not_started" },
        writing: { status: "not_started" },
        speaking: { status: "not_started" },
      },
    };
  },

  async getHistory(page = 1, pageSize = 10, status?: string, mode?: string): Promise<any> {
    let url = `/attempts/history?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (mode) url += `&mode=${mode}`;
    return apiClient.get<any>(url);
  },

  async getInProgressAttempt(): Promise<any> {
    try {
      const res = await apiClient.get<any>(`/attempts/in-progress`);
      return res;
    } catch {
      return null;
    }
  },

  async getAttemptProgress(attemptId: string | number): Promise<any> {
    return apiClient.get<any>(`/attempts/${attemptId}/progress`);
  },

  async autosaveMockTest(attemptId: string, currentSkill: string, draftStateJson: string): Promise<void> {
    await apiClient.patch(`/attempts/${attemptId}/autosave`, {
      currentSkill,
      draftStateJson,
      clientUpdatedAt: new Date().toISOString()
    });
  },

  async submitMockTest(attemptId: string, draftStateJson: string): Promise<any> {
    return await apiClient.post<any>(`/attempts/${attemptId}/submit`, {
      draftStateJson
    });
  },

  async getAttemptResult(id: string): Promise<any> {
    return await apiClient.get<any>(`/attempts/${id}/result`);
  },

  async getAttemptReview(id: string): Promise<any> {
    return await apiClient.get<any>(`/attempts/${id}/review`);
  },

  async deleteAttempt(id: string | number): Promise<void> {
    await apiClient.delete(`/attempts/${id}`);
  },

  async saveSkillAttempt(
    skill: Skill,
    data: Omit<SkillAttempt, "skill">
  ): Promise<MockTestAttempt> {
    return attemptsMockService.saveSkillAttempt(skill, data);
  },

  async getCurrentAttempt(): Promise<MockTestAttempt | null> {
    return attemptsMockService.getCurrentAttempt();
  },

  async finishMockTest(): Promise<MockTestAttempt | null> {
    return attemptsMockService.finishMockTest();
  },

  async getAttemptById(id: string): Promise<MockTestAttempt | null> {
    return attemptsMockService.getAttemptById(id);
  },

  async getLastAttempt(): Promise<MockTestAttempt | null> {
    return attemptsMockService.getLastAttempt();
  },

  async uploadSpeakingRecording(
    attemptId: string,
    partId: number,
    blob: Blob
  ): Promise<string> {
    return attemptsMockService.uploadSpeakingRecording(attemptId, partId, blob);
  },

  async submitWriting(
    attemptId: string,
    writings: Record<number, string>
  ): Promise<void> {
    await attemptsMockService.submitWriting(attemptId, writings);
  },

  clearAttempt(): void {
    attemptsMockService.clearAttempt();
  },
};

export default attemptsApiService;
