import { tasks, sampleEssays, writingGrammarPatterns, writingFeedbackAITemplates, task1Samples, task2Samples } from "../mocks/writing.mock";
import { type TextError } from "../components/AnnotatedText";

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

export const writingService = {
  async getWritingQuiz() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      tasks,
      sampleEssays,
    };
  },

  async getWritingSamples() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      task1Samples,
      task2Samples,
    };
  },

  async generateWritingFeedback(writings: Record<number, string>) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const feedback: Record<number, { taskAchievement: string; coherence: string; lexical: string; grammar: string; score: string; tips: string[]; errors: TextError[] }> = {};
    
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

export default writingService;
