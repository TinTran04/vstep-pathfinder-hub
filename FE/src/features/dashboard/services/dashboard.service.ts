import { recentScores, weeklyData, streakDays, pointActions, rewardsStore } from "../mocks/dashboard.mock";

export const dashboardService = {
  async getDashboardData() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      recentScores,
      weeklyData,
      streakDays,
      pointActions,
      rewardsStore,
    };
  },
};

export default dashboardService;
