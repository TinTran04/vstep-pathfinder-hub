// src/features/attempts/services/attempts.mock-service.ts
// ============================================================
// Mock implementation of IAttemptsService using localStorage.
// All methods are async (return Promises) to match the shared interface
// so components can safely await any call regardless of data source.
//
// Data is persisted under:
//   localStorage: "vstep_attempts_v1"
//   sessionStorage: "vstep_current_attempt_id"
// ============================================================

import { type MockTestAttempt, type Skill, type SkillAttempt } from "../types";
import { calculateOverallScore } from "../mocks/attempts.mock";

const LOCAL_STORAGE_KEY = "vstep_attempts_v1";
const SESSION_STORAGE_KEY = "vstep_current_attempt_id";

// ----------------------------------------------------------------
// Private helpers
// ----------------------------------------------------------------

function readAttemptsMap(): Record<string, MockTestAttempt> {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("[mock-service] Error reading attempts from localStorage", e);
    return {};
  }
}

function writeAttemptsMap(map: Record<string, MockTestAttempt>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("[mock-service] Error saving attempts to localStorage", e);
  }
}

function computeLevel(score: number): string {
  if (score >= 8.5) return "C1";
  if (score >= 6.0) return "B2";
  if (score >= 4.0) return "B1";
  return "A2";
}

function generateAnalysis(attempt: MockTestAttempt) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendedPractice: string[] = [];
  const { skills } = attempt;

  const getSkillScore = (skillName: Skill): number | null => {
    const skill = skills[skillName];
    if (!skill) return null;
    if (skill.score !== undefined && skill.totalQuestions && skill.totalQuestions > 0) {
      return (skill.score / skill.totalQuestions) * 10;
    }
    if (skillName === "writing") {
      const feedback = skill.writingFeedback;
      if (feedback && Object.keys(feedback).length > 0) {
        const scores = Object.values(feedback).map((f) => {
          const match = f.score.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : 7.0;
        });
        return scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }
    if (skillName === "speaking") {
      const feedback = skill.speakingFeedback;
      if (feedback && Object.keys(feedback).length > 0) {
        const scores = Object.values(feedback).map((f) => {
          const match = f.pronunciation.match(/^([\d.]+)/);
          return match ? parseFloat(match[0]) : 7.0;
        });
        return scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }
    return null;
  };

  const lisScore = getSkillScore("listening");
  const redScore = getSkillScore("reading");
  const wrtScore = getSkillScore("writing");
  const spkScore = getSkillScore("speaking");

  if (lisScore !== null) {
    if (lisScore >= 7.0) {
      strengths.push("Bạn có khả năng nghe hiểu tốt, nhận biết được các từ khóa và ý chính trong hội thoại và bài giảng.");
    } else if (lisScore < 6.0) {
      weaknesses.push("Cần cải thiện khả năng nghe từ khóa và phân tích thông báo ngắn.");
      recommendedPractice.push("Luyện nghe các thông báo ngắn và hội thoại hàng ngày tại VSTEPPro.");
    }
  }
  if (redScore !== null) {
    if (redScore >= 7.0) {
      strengths.push("Bạn xử lý bài đọc khá ổn, định vị thông tin chi tiết và từ vựng trong văn cảnh tốt.");
    } else if (redScore < 6.0) {
      weaknesses.push("Cần cải thiện khả năng đọc hiểu chi tiết và suy luận thông tin.");
      recommendedPractice.push("Luyện thêm dạng câu hỏi suy luận (inference) trong Reading.");
    }
  }
  if (wrtScore !== null) {
    if (wrtScore >= 7.0) {
      strengths.push("Bài viết có cấu trúc tốt, sử dụng vốn từ vựng phong phú và liên kết câu mạch lạc.");
    } else if (wrtScore < 6.0) {
      weaknesses.push("Cần cải thiện cấu trúc ngữ pháp, tính liên kết mạch lạc và vốn từ vựng học thuật.");
      recommendedPractice.push("Viết lại Task 2 với outline rõ ràng hơn và sử dụng nhiều từ nối đa dạng.");
    }
  }
  if (spkScore !== null) {
    if (spkScore >= 7.0) {
      strengths.push("Khả năng diễn đạt nói khá tự nhiên, phát âm rõ và độ trôi chảy tốt.");
    } else if (spkScore < 6.0) {
      weaknesses.push("Cần luyện phát âm chuẩn xác, tăng độ trôi chảy và hạn chế ngập ngừng.");
      recommendedPractice.push("Luyện Speaking Part 2 mỗi ngày 5 phút.");
    }
  }

  if (strengths.length === 0) strengths.push("Bạn có tinh thần luyện tập tốt và hoàn thành đầy đủ bài làm.");
  if (weaknesses.length === 0) weaknesses.push("Không có điểm yếu rõ rệt ở các kỹ năng đã làm.");
  if (recommendedPractice.length === 0) recommendedPractice.push("Tiếp tục duy trì làm đề thi thử full test để giữ vững phong độ.");

  return { strengths, weaknesses, recommendedPractice };
}

function finalizeAttempt(attempt: MockTestAttempt): void {
  attempt.finishedAt = Date.now();
  attempt.overallScore = calculateOverallScore(attempt);
  attempt.level = computeLevel(attempt.overallScore);
  const analysis = generateAnalysis(attempt);
  attempt.strengths = analysis.strengths;
  attempt.weaknesses = analysis.weaknesses;
  attempt.recommendedPractice = analysis.recommendedPractice;
}

// ----------------------------------------------------------------
// Mock service — all methods return Promises for interface parity
// ----------------------------------------------------------------

export const attemptsMockService = {
  // ---- Exposed for tests ----
  getAttemptsMap: readAttemptsMap,
  saveAttemptsMap: writeAttemptsMap,

  async startAttempt(mode: "practice" | "mock_test" = "mock_test"): Promise<MockTestAttempt> {
    const id = `${mode}-${Date.now()}`;
    const attempt: MockTestAttempt = { id, mode, startedAt: Date.now(), skills: {} };
    const map = readAttemptsMap();
    map[id] = attempt;
    writeAttemptsMap(map);
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    return attempt;
  },

  /** @deprecated Use startAttempt("mock_test"). */
  async startMockTest(): Promise<MockTestAttempt> {
    return this.startAttempt("mock_test");
  },

  async saveSkillAttempt(
    skill: Skill,
    data: Omit<SkillAttempt, "skill">
  ): Promise<MockTestAttempt> {
    let attemptId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const map = readAttemptsMap();
    let attempt: MockTestAttempt | null = null;

    if (attemptId && map[attemptId]) {
      attempt = map[attemptId];
    }

    // Determine mode: prioritize existing attempt's mode, otherwise look at URL, default to "practice"
    const isMock =
      window.location.search.includes("mode=mock_test") ||
      window.location.pathname.includes("/mock-test");
    const mode: "practice" | "mock_test" = attempt ? attempt.mode : (isMock ? "mock_test" : "practice");

    if (!attempt) {
      const sorted = Object.values(map).sort((a, b) => b.startedAt - a.startedAt);
      const last = sorted.find((a) => a.mode === mode && !a.finishedAt);
      if (last) {
        attempt = last;
        attemptId = last.id;
      } else {
        attemptId = `${mode}-${Date.now()}`;
        attempt = { id: attemptId, mode, startedAt: Date.now(), skills: {} };
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, attemptId!);
    }

    attempt.skills[skill] = { ...data, skill };

    if (mode === "practice") {
      finalizeAttempt(attempt);
    }

    map[attemptId!] = attempt;
    writeAttemptsMap(map);
    return attempt;
  },

  async getCurrentAttempt(): Promise<MockTestAttempt | null> {
    const id = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) return null;
    return this.getAttemptById(id);
  },

  async finishMockTest(): Promise<MockTestAttempt | null> {
    const id = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) return null;
    const map = readAttemptsMap();
    const attempt = map[id];
    if (!attempt) return null;
    finalizeAttempt(attempt);
    map[id] = attempt;
    writeAttemptsMap(map);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return attempt;
  },

  async getAttemptById(id: string): Promise<MockTestAttempt | null> {
    return readAttemptsMap()[id] ?? null;
  },

  async getLastAttempt(): Promise<MockTestAttempt | null> {
    const attempts = Object.values(readAttemptsMap());
    if (!attempts.length) return null;
    return attempts.sort((a, b) => b.startedAt - a.startedAt)[0];
  },

  async getAttemptResult(id: string): Promise<MockTestAttempt | null> {
    return this.getAttemptById(id);
  },

  async getAttemptReview(id: string): Promise<MockTestAttempt | null> {
    return this.getAttemptById(id);
  },

  async uploadSpeakingRecording(
    _attemptId: string,
    _partId: number,
    blob: Blob
  ): Promise<string> {
    // TODO: Replace with real API upload when backend is ready.
    // The returned blob URL is temporary and will break after F5.
    console.warn(
      "[mock-service] uploadSpeakingRecording is a no-op in mock mode. " +
        "Blob URL is temporary — connect backend to persist recordings."
    );
    return URL.createObjectURL(blob);
  },

  async submitWriting(
    _attemptId: string,
    _writings: Record<number, string>
  ): Promise<void> {
    // No-op: Writing feedback is handled directly by writingService.generateWritingFeedback().
  },

  clearAttempt(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  async getInProgressAttempt(): Promise<any> {
    return null;
  },

  async getAttemptProgress(_attemptId: string | number): Promise<any> {
    return null;
  },

  async autosaveMockTest(attemptId: string, currentSkill: string, draftStateJson: string): Promise<void> {
    // No-op
  },

  async submitMockTest(attemptId: string, draftStateJson: string): Promise<any> {
    return null;
  }
};

export default attemptsMockService;
