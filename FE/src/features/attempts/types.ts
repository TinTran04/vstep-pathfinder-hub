// src/features/attempts/types.ts

export type QuizMode = "practice" | "mock_test";
export type Skill = "listening" | "reading" | "writing" | "speaking";

export interface ModePermissions {
  canPauseTimer: boolean;
  canSeekListeningAudio: boolean;
  canReplayListeningAudio: boolean;
  canViewAnswersDuringQuiz: boolean;
  canViewAnswersAfterSubmit: boolean;
  canViewExplanationAfterSubmit: boolean;
  isFull4SkillTest: boolean;
  showOverallScore: boolean;
  canViewCorrectAnswer?: boolean;
  canViewExplanation?: boolean;
  canPlaybackSpeaking?: boolean;
}

export interface TextError {
  word: string;
  type: "grammar" | "spelling" | "vocabulary" | "coherence";
  suggestion?: string;
  explanation?: string;
}

export interface WritingFeedbackResult {
  taskAchievement: string;
  coherence: string;
  lexical: string;
  grammar: string;
  score: string;
  tips: string[];
  errors: TextError[];
}

export interface SpeakingFeedbackResult {
  pronunciation: string;
  fluency: string;
  grammar: string;
  vocabulary: string;
  tips: string[];
  transcript?: string;
}

export interface SkillAttempt {
  skill: Skill;
  // Listening & Reading
  answers?: Record<number, number>;
  score?: number;
  totalQuestions?: number;
  // Writing
  writings?: Record<number, string>;
  writingFeedback?: Record<number, WritingFeedbackResult>;
  // Speaking
  recordings?: Record<number, string>;
  speakingFeedback?: Record<number, SpeakingFeedbackResult>;
}

export interface MockTestAttempt {
  id: string;
  mode: QuizMode;
  startedAt: number;
  finishedAt?: number;
  skills: Partial<Record<Skill, SkillAttempt>>;
  overallScore?: number;
  level?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendedPractice?: string[];
}
