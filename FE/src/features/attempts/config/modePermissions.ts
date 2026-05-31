// src/features/attempts/config/modePermissions.ts
import { type QuizMode, type ModePermissions, type Skill } from "../types";

export const MODE_PERMISSIONS: Record<QuizMode, ModePermissions> = {
  practice: {
    canPauseTimer: true,
    canSeekListeningAudio: true,
    canReplayListeningAudio: true,
    canViewAnswersDuringQuiz: false,
    canViewAnswersAfterSubmit: true,
    canViewExplanationAfterSubmit: true,
    isFull4SkillTest: false,
    showOverallScore: false,
    canViewCorrectAnswer: true,
    canViewExplanation: true,
    canPlaybackSpeaking: true,
  },
  mock_test: {
    canPauseTimer: false,
    canSeekListeningAudio: false,
    canReplayListeningAudio: false,
    canViewAnswersDuringQuiz: false,
    canViewAnswersAfterSubmit: true,
    canViewExplanationAfterSubmit: true,
    isFull4SkillTest: true,
    showOverallScore: true,
    canViewCorrectAnswer: true,
    canViewExplanation: true,
    canPlaybackSpeaking: true,
  },
};

export const MOCK_TEST_SKILL_ORDER: Skill[] = [
  "listening",
  "reading",
  "writing",
  "speaking",
];

export const MOCK_TEST_NEXT_ROUTE: Record<string, string> = {
  listening: "/quiz/reading/take",
  reading: "/quiz/writing/take",
  writing: "/quiz/speaking/take",
  speaking: "/mock-test/review",
};

export const MOCK_TEST_NEXT_SKILL_LABEL: Record<string, string> = {
  listening: "Reading",
  reading: "Writing",
  writing: "Speaking",
  speaking: "Xem kết quả",
};

export const SKILL_LABELS: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

export const SKILL_TIMES: Record<Skill, string> = {
  listening: "~40 phút",
  reading: "~60 phút",
  writing: "~60 phút",
  speaking: "~12–15 phút",
};

export const DEFAULT_MODE: QuizMode = "practice";

export function getPermissions(mode: string, phase: "taking" | "review" = "taking"): ModePermissions {
  if (phase === "review") {
    return {
      canPauseTimer: false,
      canSeekListeningAudio: true,
      canReplayListeningAudio: true,
      canViewAnswersDuringQuiz: false,
      canViewAnswersAfterSubmit: true,
      canViewExplanationAfterSubmit: true,
      isFull4SkillTest: mode === "mock_test",
      showOverallScore: true,
      canViewCorrectAnswer: true,
      canViewExplanation: true,
      canPlaybackSpeaking: true,
    };
  }
  const validMode = mode === "mock_test" ? "mock_test" : "practice";
  return MODE_PERMISSIONS[validMode as QuizMode];
}

export function isValidMode(mode: string): mode is QuizMode {
  return mode === "practice" || mode === "mock_test";
}
