// src/features/quiz/services/practice.api-service.ts
// ============================================================
// Practice API Service — dùng chung cho Listening và Reading.
//
// Endpoints:
//   POST /api/{skill}-practice/{examId}/start
//     → StartPracticeResponse  (có attemptId + exam detail)
//
//   POST /api/{skill}-practice/{attemptId}/submit
//     → SubmitPracticeResponse (score, correctCount, totalQuestions)
//
//   GET  /api/{skill}-practice/attempts/{attemptId}/result
//     → AttemptResultResponse
//
// "skill" = "listening" | "reading"
// ============================================================

import { apiClient } from "@/services/api-client";
import type {
  ExamDetailResponse,
  SectionResponse,
  QuestionResponse,
  OptionResponse,
} from "./exam.service";

// ─── Re-export exam shapes for convenience ───────────────────
export type { ExamDetailResponse, SectionResponse, QuestionResponse, OptionResponse };

// ─── BE Response types ────────────────────────────────────────

export interface StartPracticeResponse {
  attemptId: number;
  examId: number;
  skillType: string;
  status: string;
  startedAt: string;
  exam: ExamDetailResponse;
}

export interface SubmitAnswerPayload {
  questionId: number; // GUID or number
  userAnswer: string; // Label of chosen option e.g. "A", "B", or free text
}

export interface SubmitPracticeResponse {
  attemptId: number;
  status: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  submittedAt: string | null;
}

export interface AttemptAnswerResponse {
  answerId: number;
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  correctAnswer?: string | null;
  explanation?: string | null;
}

export interface AttemptResultResponse {
  attemptId: number;
  examId: number;
  skillType: string;
  status: string;
  score: number | null;
  totalQuestions: number | null;
  correctCount: number | null;
  durationUsedSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
  answers: AttemptAnswerResponse[];
}

// ─── Service ─────────────────────────────────────────────────

type PracticeSkill = "listening" | "reading";

type AnyRecord = Record<string, unknown>;

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

function isRecord(value: unknown): value is AnyRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getString(source: AnyRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function getNumber(source: AnyRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number") return value;
  }
  return undefined;
}

function getBoolean(source: AnyRecord, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function getArray(source: AnyRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function sortByOrder<T extends { orderIndex?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

function normalizeOption(raw: unknown, index: number): OptionResponse {
  if (!isRecord(raw)) {
    return {
      optionId: index,
      label: OPTION_LABELS[index] ?? String(index + 1),
      content: String(raw ?? ""),
      orderIndex: index,
    };
  }

  const label = getString(raw, ["label", "optionLabel", "letter"], OPTION_LABELS[index] ?? String(index + 1));
  return {
    optionId: getNumber(raw, ["optionId", "id", "answerOptionId"]) ?? index,
    label,
    content: getString(raw, ["content", "optionText", "text", "value", "answerText"]),
    isCorrect: getBoolean(raw, ["isCorrect", "correct"]),
    orderIndex: getNumber(raw, ["orderIndex", "order", "displayOrder", "DisplayOrder", "sequence"]) ?? index,
  };
}

function normalizeQuestion(raw: unknown, index: number): QuestionResponse | null {
  if (!isRecord(raw)) return null;

  const options = sortByOrder(
    getArray(raw, ["options", "answerOptions", "choices", "answers"]).map(normalizeOption)
  );

  return {
    questionId: getNumber(raw, ["questionId", "id", "questionGuid"]) ?? index,
    questionText: getString(raw, ["questionText", "text", "content", "prompt"]),
    explanation: getString(raw, ["explanation", "explain"], ""),
    options,
    orderIndex: getNumber(raw, ["orderIndex", "order", "displayOrder", "DisplayOrder", "sequence", "questionNumber"]) ?? index,
  };
}

function normalizeSection(raw: unknown, index: number): SectionResponse | null {
  if (!isRecord(raw)) return null;

  const directQuestions = getArray(raw, ["questions", "questionResponses"]);
  const nestedQuestions = getArray(raw, ["questionGroups", "groups", "parts"]).flatMap((group) =>
    isRecord(group) ? getArray(group, ["questions", "questionResponses"]) : []
  );
  const questions = sortByOrder([...directQuestions, ...nestedQuestions].map(normalizeQuestion).filter(Boolean) as QuestionResponse[]);

  return {
    sectionId: getNumber(raw, ["sectionId", "id", "passageId"]) ?? index,
    title: getString(raw, ["title", "name"], `Passage ${index + 1}`),
    instruction: getString(raw, ["instruction", "instructions", "direction", "directions"], ""),
    passageText: getString(raw, ["passageText", "passage", "content", "text", "readingText"], ""),
    audioUrl: getString(raw, ["audioUrl", "audio"], "") || undefined,
    questions,
    orderIndex: getNumber(raw, ["orderIndex", "order", "displayOrder", "DisplayOrder", "sequence", "sectionNumber"]) ?? index,
  };
}

function getUniqueSortedQuestions(sections: SectionResponse[]): QuestionResponse[] {
  const byId = new Map<number, QuestionResponse>();

  for (const question of sections.flatMap((section) => section.questions)) {
    byId.set(question.questionId, question);
  }

  return sortByOrder([...byId.values()]);
}

function normalizeReadingPassageQuestions(exam: ExamDetailResponse): ExamDetailResponse {
  if (exam.skillType?.toLowerCase() !== "reading" || exam.sections.length < 4) {
    return exam;
  }

  const allQuestions = getUniqueSortedQuestions(exam.sections);
  if (allQuestions.length === 0) {
    return exam;
  }

  const passageCount = 4;
  const questionsPerPassage = 10;
  const normalizedSections = exam.sections.slice(0, passageCount).map((section, index) => ({
    ...section,
    questions: allQuestions.slice(index * questionsPerPassage, (index + 1) * questionsPerPassage),
  }));

  return {
    ...exam,
    sections: normalizedSections,
  };
}

function normalizeExam(rawExam: ExamDetailResponse): ExamDetailResponse {
  const raw = rawExam as unknown as AnyRecord;
  const sectionSources = [
    ...getArray(raw, ["sections", "examSections"]),
    ...getArray(raw, ["passages", "readingPassages"]),
  ];

  const sections = sortByOrder(
    sectionSources.map(normalizeSection).filter(Boolean) as SectionResponse[]
  );

  if (sections.length === 0) {
    const questions = sortByOrder(getArray(raw, ["questions", "questionResponses"]).map(normalizeQuestion).filter(Boolean) as QuestionResponse[]);
    if (questions.length > 0) {
      sections.push({
        sectionId: rawExam.examId,
        title: rawExam.title,
        instruction: "",
        passageText: getString(raw, ["passageText", "passage", "content", "text", "readingText", "description"], rawExam.description ?? ""),
        questions,
        orderIndex: 0,
      });
    }
  }

  return {
    ...rawExam,
    sections,
  };
}

function normalizeStartResponse(res: StartPracticeResponse): StartPracticeResponse {
  return {
    ...res,
    exam: normalizeReadingPassageQuestions(normalizeExam(res.exam)),
  };
}

function normalizeAttemptAnswer(raw: unknown, index: number): AttemptAnswerResponse | null {
  if (!isRecord(raw)) return null;

  return {
    answerId: getNumber(raw, ["answerId", "attemptAnswerId", "id"]) ?? index,
    questionId: getNumber(raw, ["questionId", "questionGuid", "id"]) ?? 0,
    userAnswer: getString(raw, ["userAnswer", "selectedAnswer", "selectedOptionLabel", "answer"]),
    isCorrect: getBoolean(raw, ["isCorrect", "correct"]) ?? false,
    score: getNumber(raw, ["score", "point", "points"]) ?? 0,
    correctAnswer: getString(raw, ["correctAnswer", "correctOptionLabel", "correctLabel"], ""),
    explanation: getString(raw, ["explanation", "explain"], ""),
  };
}

function normalizeAttemptResult(res: AttemptResultResponse): AttemptResultResponse {
  const raw = res as unknown as AnyRecord;
  return {
    ...res,
    score: getNumber(raw, ["score", "totalScore"]) ?? res.score,
    totalQuestions: getNumber(raw, ["totalQuestions", "questionCount"]) ?? res.totalQuestions,
    correctCount: getNumber(raw, ["correctCount", "correctAnswers"]) ?? res.correctCount,
    answers: getArray(raw, ["answers", "attemptAnswers", "answerResults"])
      .map(normalizeAttemptAnswer)
      .filter(Boolean) as AttemptAnswerResponse[],
  };
}

export const practiceApiService = {
  /**
   * Bắt đầu một bài luyện tập.
   * BE tạo attempt và trả về toàn bộ đề thi (questions + options).
   */
  async start(
    skill: PracticeSkill,
    examId: number
  ): Promise<StartPracticeResponse> {
    const res = await apiClient.post<StartPracticeResponse>(
      `/${skill}-practice/${examId}/start`
    );
    return normalizeStartResponse(res);
  },

  /**
   * Nộp bài luyện tập.
   * @param answers Map<questionId(number), userAnswer(string label e.g. "A")>
   */
  async submit(
    skill: PracticeSkill,
    attemptId: number,
    answers: Record<number, string>,
    durationUsedSeconds: number
  ): Promise<SubmitPracticeResponse> {
    const payload = {
      durationUsedSeconds,
      answers: Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId: Number(questionId),
        userAnswer,
      })),
    };
    return apiClient.post<SubmitPracticeResponse>(
      `/${skill}-practice/${attemptId}/submit`,
      payload
    );
  },

  /**
   * Lấy kết quả chi tiết sau khi nộp.
   */
  async getResult(
    skill: PracticeSkill,
    attemptId: number
  ): Promise<AttemptResultResponse> {
    const res = await apiClient.get<AttemptResultResponse>(
      `/${skill}-practice/attempts/${attemptId}/result`
    );
    return normalizeAttemptResult(res);
  },

  /**
   * Xóa/hủy một attempt (mock test).
   */
  async deleteAttempt(attemptId: number): Promise<void> {
    await apiClient.delete(`/attempts/${attemptId}`);
  },
};

export default practiceApiService;
