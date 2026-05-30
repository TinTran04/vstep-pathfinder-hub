// src/features/quiz/services/exam.service.ts
// ============================================================
// Exam Service — gọi API thật tới GET /api/exams
//
// BE endpoint:
//   GET /api/exams?skillType=listening&page=1&pageSize=50
//   Authorization: Bearer <access_token>
//
// Response (unwrapped by apiClient):
//   PagedResponse<ExamResponse>
//   {
//     items: ExamResponse[],
//     totalCount: number,
//     page: number,
//     pageSize: number,
//     totalPages: number,
//   }
//
// ExamResponse shape (mirrors ExamResponses.cs):
//   examId, title, skillType, description,
//   durationMinutes, audioUrl, imageUrl, isPublished,
//   createdAt, updatedAt
// ============================================================

import { apiClient } from "@/services/api-client";

// ─── BE response types ───────────────────────────────────────

export interface ExamResponse {
  examId: number;   // BE returns int
  title: string;
  skillType: string; // "listening" | "reading" | "writing" | "speaking"
  description: string;
  durationMinutes: number;
  audioUrl: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface OptionResponse {
  optionId: number;  // BE returns int
  label: string;
  content: string;
  isCorrect?: boolean;
  orderIndex?: number;
}

export interface QuestionResponse {
  questionId: number;  // BE returns int
  questionText: string;
  explanation?: string | null;
  options: OptionResponse[];
  orderIndex?: number;
}

export interface SectionResponse {
  sectionId: number;  // BE returns int
  title: string;
  instruction?: string | null;
  passageText?: string | null;
  questions: QuestionResponse[];
  orderIndex?: number;
}

export interface ExamDetailResponse extends ExamResponse {
  sections: SectionResponse[];
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── FE-friendly shape used in Quiz.tsx ──────────────────────

export interface ExamItem {
  id: number;            // examId (int from BE)
  title: string;
  description: string;
  duration: string;      // e.g. "30 phút"
  skillType: string;
}

// ─── Mapper ──────────────────────────────────────────────────

function toExamItem(r: ExamResponse): ExamItem {
  return {
    id: r.examId,  // number (int)
    title: r.title,
    description: r.description,
    duration: `${r.durationMinutes} phút`,
    skillType: r.skillType.toLowerCase(),
  };
}

// ─── Service ─────────────────────────────────────────────────

export const examService = {
  /**
   * Lấy danh sách đề thi của một kỹ năng.
   * Trả về mảng rỗng nếu chưa có đề (BE trả items: []).
   */
  async getExamsBySkill(
    skillType: string,
    page = 1,
    pageSize = 50
  ): Promise<ExamItem[]> {
    const params = new URLSearchParams({
      skillType,
      page: String(page),
      pageSize: String(pageSize),
    });

    const res = await apiClient.get<PagedResponse<ExamResponse>>(
      `/exams?${params.toString()}`
    );

    return (res.items ?? []).map(toExamItem);
  },
};

export default examService;
