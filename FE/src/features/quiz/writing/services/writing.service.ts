import { tasks, sampleEssays, writingGrammarPatterns, writingFeedbackAITemplates, task1Samples, task2Samples } from "../mocks/writing.mock";
import { type TextError } from "../components/AnnotatedText";
import { isApiDataSource } from "@/services/data-source";
import { writingApiService } from "./writing.api-service";
import { examService } from "@/features/quiz/services/exam.service";
import type { WritingFeedbackResult } from "@/features/attempts/types";

// ─── findErrors (dùng chung) ───────────────────────────────────
const findErrors = (text: string): TextError[] => {
  const errors: TextError[] = [];

  writingGrammarPatterns.forEach(({ regex, suggestion, explanation, type }) => {
    let match;
    const re = new RegExp(regex.source, regex.flags);
    while ((match = re.exec(text)) !== null) {
      const sug = typeof suggestion === "function" ? (suggestion as (m: string) => string)(match[0]) : suggestion;
      // Skip empty suggestions (informational only like their/there/they're)
      if (!sug) continue;
      errors.push({
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        suggestion: sug,
        explanation,
        type,
      });
    }
  });

  // Remove overlapping errors (keep the first found)
  errors.sort((a, b) => a.start - b.start);
  const filtered: TextError[] = [];
  let lastEnd = -1;
  for (const err of errors) {
    if (err.start >= lastEnd) {
      filtered.push(err);
      lastEnd = err.end;
    }
  }

  return filtered;
};

// ─── Mock implementation ──────────────────────────────────────
const mockImpl = {
  async getWritingQuiz() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      tasks,
      sampleEssays,
    };
  },

  async getWritingSamples() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const stored = localStorage.getItem("vstep_writing_samples");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing writing samples", e);
      }
    }
    const data = { task1Samples, task2Samples };
    localStorage.setItem("vstep_writing_samples", JSON.stringify(data));
    return data;
  },

  async generateWritingFeedback(writings: Record<number, string>) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const feedback: Record<number, WritingFeedbackResult> = {};
    
    tasks.forEach(t => {
      const text = writings[t.id] || "";
      const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
      const errors = findErrors(text);

      if (wc < 20) {
        feedback[t.id] = {
          taskAchievement: "N/A – Bài viết quá ngắn để đánh giá",
          coherence: "N/A",
          lexical: "N/A",
          grammar: "N/A",
          score: "0/10",
          tips: ["Viết tối thiểu " + t.minWords + " từ để được đánh giá"],
          errors: [],
        };
      } else {
        const base = writingFeedbackAITemplates[t.id];
        feedback[t.id] = { ...base, errors };
      }
    });

    return feedback;
  },
};

// ─── API implementation ───────────────────────────────────────
export interface WritingApiFeedbackItem {
  source: "api";
  score: number | null;
  feedback: string | null;
  status: string;
  submissionId: number;
}

const apiImpl = {
  ...mockImpl,   // fallback cho getWritingQuiz, getWritingSamples

  async generateWritingFeedback(
    writings: Record<number, string>,
    examIds?: number[]
  ): Promise<Record<number, WritingFeedbackResult | WritingApiFeedbackItem>> {
    if (!examIds?.length) {
      return mockImpl.generateWritingFeedback(writings);
    }

    const results: Record<number, any> = {};
    const entries = Object.entries(writings);

    for (const [taskIdxStr, essayText] of entries) {
      const taskIdx = Number(taskIdxStr);
      const examId = examIds[taskIdx - 1] ?? examIds[taskIdx] ?? examIds[0];

      if (!examId || !essayText.trim()) {
        results[taskIdx] = { source: "api", score: null, feedback: null, status: "skipped", submissionId: 0 };
        continue;
      }

      try {
        const exam = await examService.getExamById(examId);
        const prompt = exam.description || "";
        const submission = await writingApiService.submit(examId, prompt, essayText);
        const result = await writingApiService.pollUntilGraded(submission.writingSubmissionId);
        results[taskIdx] = {
          source: "api",
          score: result.score,
          feedback: result.feedback,
          status: result.status,
          submissionId: result.writingSubmissionId,
        };
      } catch (err) {
        console.error(`[writingService API] Failed for task ${taskIdx}:`, err);
        results[taskIdx] = { source: "api", score: null, feedback: null, status: "failed", submissionId: 0 };
      }
    }

    return results;
  },
};

// ─── Dispatcher ───────────────────────────────────────────────
const writingService = isApiDataSource ? apiImpl : mockImpl;
export { writingService, type WritingApiFeedbackItem };
export default writingService;
