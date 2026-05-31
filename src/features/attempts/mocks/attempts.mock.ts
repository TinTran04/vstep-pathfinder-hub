// src/features/attempts/mocks/attempts.mock.ts
import { type MockTestAttempt } from "../types";

function extractScore(value: unknown, fallback = 7.0): number {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const directScore = record.score;

  if (typeof directScore === "number" && Number.isFinite(directScore)) {
    return directScore;
  }

  if (typeof directScore === "string") {
    const match = directScore.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : fallback;
  }

  const textSources = [
    record.pronunciation,
    record.fluency,
    record.taskAchievement,
    record.feedback,
  ];

  for (const source of textSources) {
    if (typeof source !== "string") {
      continue;
    }

    const match = source.match(/[\d.]+/);
    if (match) {
      return parseFloat(match[0]);
    }
  }

  return fallback;
}

export function calculateOverallScore(attempt: MockTestAttempt): number {
  let total = 0;
  let count = 0;

  const { skills } = attempt;

  if (skills.listening && skills.listening.totalQuestions) {
    const { score = 0, totalQuestions } = skills.listening;
    total += (score / totalQuestions) * 10;
    count++;
  }

  if (skills.reading && skills.reading.totalQuestions) {
    const { score = 0, totalQuestions } = skills.reading;
    total += (score / totalQuestions) * 10;
    count++;
  }

  if (skills.writing) {
    const feedback = skills.writing.writingFeedback;
    if (feedback && Object.keys(feedback).length > 0) {
      const scores = Object.values(feedback).map((f) => extractScore(f));
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      total += avg;
    } else {
      total += 7.0;
    }
    count++;
  }

  if (skills.speaking) {
    const feedback = skills.speaking.speakingFeedback;
    if (feedback && Object.keys(feedback).length > 0) {
      const scores = Object.values(feedback).map((f) => extractScore(f));
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      total += avg;
    } else {
      total += 7.0;
    }
    count++;
  }

  if (count === 0) return 0;
  return Math.round((total / count) * 10) / 10;
}
