// src/features/attempts/mocks/attempts.mock.ts
import { type MockTestAttempt } from "../types";

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
      const scores = Object.values(feedback).map((f) => {
        const match = f.score.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 7.0;
      });
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
      // Extract score from "7.5/10 – ..." format
      const scores = Object.values(feedback).map((f) => {
        const match = f.pronunciation.match(/^([\d.]+)/);
        return match ? parseFloat(match[0]) : 7.0;
      });
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
