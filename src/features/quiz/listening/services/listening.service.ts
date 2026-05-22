import { listeningParts, PART_DURATIONS, TOTAL_TIME } from "../mocks/listening.mock";

export const listeningService = {
  async getListeningQuiz() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      listeningParts,
      partDurations: PART_DURATIONS,
      totalTime: TOTAL_TIME,
    };
  },
};

export default listeningService;
