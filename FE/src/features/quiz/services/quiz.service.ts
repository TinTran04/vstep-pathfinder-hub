import { skills, quizzes, overviewData, topStudents, testimonials, stats, skillStats } from "../mocks/quiz.mock";

export const quizService = {
  async getQuizSkills() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return skills;
  },

  async getQuizList() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return quizzes;
  },

  async getQuizOverview() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return overviewData;
  },

  async getQuizResultsData() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      topStudents,
      testimonials,
      stats,
      skillStats,
    };
  },
};

export default quizService;
