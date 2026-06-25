// src/features/attempts/services/attempts.service.ts
// ============================================================
// Unified service entry-point.
//
// This file selects the correct implementation at build time
// based on the VITE_DATA_SOURCE environment variable:
//
//   VITE_DATA_SOURCE=mock  → attemptsMockService  (localStorage, default)
//   VITE_DATA_SOURCE=api   → attemptsApiService   (real backend calls)
//
// Components should import from this file only:
//   import { attemptsService } from "@/features/attempts/services/attempts.service";
//
// All methods are async — components must await results.
// Switching data sources never requires changing any component.
// ============================================================

import { isMockDataSource } from "@/services/data-source";
import { attemptsMockService } from "./attempts.mock-service";
import { attemptsApiService } from "./attempts.api-service";

// ----------------------------------------------------------------
// Shared interface — both implementations are fully async.
// ----------------------------------------------------------------

import type { MockTestAttempt, Skill, SkillAttempt } from "../types";

export interface IAttemptsService {
  startAttempt(mode?: "practice" | "mock_test"): Promise<MockTestAttempt>;
  /** @deprecated Use startAttempt("mock_test") */
  startMockTest(): Promise<MockTestAttempt>;
  saveSkillAttempt(skill: Skill, data: Omit<SkillAttempt, "skill">): Promise<MockTestAttempt>;
  getCurrentAttempt(): Promise<MockTestAttempt | null>;
  finishMockTest(): Promise<MockTestAttempt | null>;
  getAttemptById(id: string): Promise<MockTestAttempt | null>;
  getLastAttempt(): Promise<MockTestAttempt | null>;
  getAttemptResult(id: string): Promise<MockTestAttempt | null>;
  getAttemptReview(id: string): Promise<MockTestAttempt | null>;
  uploadSpeakingRecording(attemptId: string, partId: number, blob: Blob): Promise<string>;
  submitWriting(attemptId: string, writings: Record<number, string>): Promise<void>;
  clearAttempt(): void;
  getInProgressAttempt(): Promise<any>;
  autosaveMockTest(attemptId: string, currentSkill: string, draftStateJson: string): Promise<void>;
  submitMockTest(attemptId: string, draftStateJson: string): Promise<any>;
}

// ----------------------------------------------------------------
// Select implementation
// ----------------------------------------------------------------

export const attemptsService: IAttemptsService = isMockDataSource
  ? attemptsMockService
  : attemptsApiService;

export default attemptsService;
