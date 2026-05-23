import { parts, TOTAL_TIME, speakingFeedbackAITemplates, type SpeakingFeedback } from "../mocks/speaking.mock";

export const speakingService = {
  async getSpeakingQuiz() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      parts,
      totalTime: TOTAL_TIME,
    };
  },

  async generateSpeakingFeedback(recordings: Record<number, string>) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const feedback: Record<number, SpeakingFeedback> = {};
    Object.keys(recordings).forEach((key) => {
      const partId = Number(key);
      feedback[partId] = speakingFeedbackAITemplates[partId] || speakingFeedbackAITemplates[1];
    });
    return feedback;
  },
};

export default speakingService;
