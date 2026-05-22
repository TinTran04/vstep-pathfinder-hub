import { passages, TOTAL_TIME } from "../mocks/reading.mock";

export const readingService = {
  async getReadingQuiz() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      passages,
      totalTime: TOTAL_TIME,
    };
  },
};

export default readingService;
