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

import type { MockTestAttempt, Skill, SkillAttempt } from "../types";
import { attemptsMockService } from "./attempts.mock-service";

export const attemptsApiService = {
  async startAttempt(mode: "practice" | "mock_test" = "mock_test"): Promise<MockTestAttempt> {
    return attemptsMockService.startAttempt(mode);
  },

  async startMockTest(): Promise<MockTestAttempt> {
    return attemptsMockService.startMockTest();
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

  async getAttemptResult(id: string): Promise<MockTestAttempt | null> {
    return attemptsMockService.getAttemptResult(id);
  },

  async getAttemptReview(id: string): Promise<MockTestAttempt | null> {
    return attemptsMockService.getAttemptReview(id);
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
