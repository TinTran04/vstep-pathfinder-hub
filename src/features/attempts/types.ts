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

export interface TimestampFeedback {
  timestamp?: string; // backward compat
  startTime?: string;
  endTime?: string;
  type?: string;
  issue?: string;
  suggestion?: string;
  feedback?: string; // backward compat
}

export interface WritingFeedbackResult {
  score: number;
  overallScore?: number;
  // New primary fields
  taskFulfillment?: number;
  grammar?: number;
  vocabulary?: number;
  organization?: number;
  // Legacy aliases
  taskResponse?: number;
  feedbackPoints: string[];
  taskAchievement?: string;
  coherence?: string;
  lexical?: string;
  tips?: string[];
  errors?: TextError[];
  // Detailed feedback
  criteriaExplanations?: Record<string, string>;
}

export interface SpeakingFeedbackResult {
  score: number;
  overallScore?: number;
  // New primary fields
  fluencyIdeaDevelopment?: number;
  pronunciation?: number;
  grammar?: number;
  vocabulary?: number;
  contentCoherence?: number;
  // Legacy aliases
  fluency?: number;
  topicDevelopment?: number;
  relevance?: number;
  feedbackPoints: string[];
  transcript?: string;
  tips?: string[];
  timestampFeedback?: TimestampFeedback[];
  // Detailed feedback
  criteriaExplanations?: Record<string, string>;
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
  writingExamIds?: number[];
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

// API Review Types
export interface OptionReviewResponse {
  optionId: number;
  questionId: number;
  label: string;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface QuestionReviewResponse {
  questionId: number;
  sectionId: number;
  questionText: string;
  questionType: string;
  correctAnswer: string;
  explanation: string | null;
  score: number;
  displayOrder: number;
  options: OptionReviewResponse[];
  userAnswer: string;
  isCorrectAnswer: boolean;
  isCorrect?: boolean;
}

export interface SectionReviewResponse {
  sectionId: number;
  examId: number;
  title: string;
  instruction: string;
  passageText: string | null;
  audioUrl: string | null;
  displayOrder: number;
  questions: QuestionReviewResponse[];
}

export interface WritingReviewResponse {
  writingSubmissionId: number;
  prompt: string;
  essayText: string;
  status: string;
  score: number | null;
  durationUsedSeconds: number | null;
  feedback: string | null;
  feedbackJson: string | null; // raw JSON string
  createdAt: string;
}

export interface SpeakingReviewResponse {
  speakingSubmissionId: number;
  audioUrl: string;
  status: string;
  score: number | null;
  durationUsedSeconds: number | null;
  feedback: string | null;
  feedbackJson: string | null; // raw JSON string
  transcript: string | null;
  createdAt: string;
}

export interface AttemptReviewResponse {
  attemptId: number;
  examId: number;
  userId: number;
  skillType: string;
  examTitle: string;
  status: string;
  totalScore: number | null;
  totalQuestions: number | null;
  correctCount: number | null;
  durationUsedSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
  sections: SectionReviewResponse[];
  writingReview: WritingReviewResponse | null;
  speakingReview: SpeakingReviewResponse | null;
}
