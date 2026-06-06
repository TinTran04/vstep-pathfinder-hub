import { apiClient } from "@/services/api-client";
import { pointActions } from "../mocks/dashboard.mock";

export interface StreakDayItem {
  date: string;
  hasActivity: boolean;
}

export interface SkillProgressItem {
  skillType: string;
  averageScoreOnTen: number | null;
  completedCount: number;
  label: string;
}

export interface SkillProgressResponse {
  listening: SkillProgressItem;
  reading: SkillProgressItem;
  writing: SkillProgressItem;
  speaking: SkillProgressItem;
}

export interface BackendRecentResult {
  id: number;
  sourceType: string;
  examId: number | null;
  examTitle: string;
  skillType: string;
  examMode: string;
  score: number | null;
  scoreOnTen: number | null;
  status: string;
  durationUsedSeconds: number | null;
  completedAt: string;
}

export interface BackendDashboardData {
  weekStudySeconds: number;
  completedCount: number;
  completedLessons: number;
  completedTests: number;
  rewardPoints: number;
  currentStreakDays: number;
  streakDays: StreakDayItem[];
  recentResults: BackendRecentResult[];
  skillProgress: SkillProgressResponse;
}

export interface ScoreItem {
  skill: string;
  test: string;
  score: number;
  total: number;
  date: string;
}

export interface WeeklyItem {
  day: string;
  hours: number;
}

export interface PointActionItem {
  action: string;
  points: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export interface DashboardFEData {
  weekStudySeconds: number;
  completedCount: number;
  rewardPoints: number;
  currentStreakDays: number;
  streakDays: StreakDayItem[];
  recentScores: ScoreItem[];
  weeklyData: WeeklyItem[];
  skillProgress: SkillProgressResponse;
  pointActions: PointActionItem[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const mapRecentResults = (results: BackendRecentResult[]): ScoreItem[] => {
  return (results || []).map((r) => {
    const capitalizedSkill = r.skillType
      ? r.skillType.charAt(0).toUpperCase() + r.skillType.slice(1).toLowerCase()
      : "";
    return {
      skill: capitalizedSkill,
      test: r.examTitle || "Luyện tập tự do",
      score: r.scoreOnTen !== null && r.scoreOnTen !== undefined ? Number(r.scoreOnTen) : 0,
      total: 10,
      date: formatDate(r.completedAt),
    };
  });
};

export const dashboardService = {
  async getDashboardData(): Promise<DashboardFEData> {
    const raw = await apiClient.get<BackendDashboardData>("/dashboard/me");
    return {
      weekStudySeconds: raw.weekStudySeconds,
      completedCount: raw.completedCount,
      rewardPoints: raw.rewardPoints,
      currentStreakDays: raw.currentStreakDays,
      streakDays: raw.streakDays || [],
      recentScores: mapRecentResults(raw.recentResults),
      weeklyData: [], // empty mock because the API has weekStudySeconds as a total
      skillProgress: raw.skillProgress,
      pointActions,
    };
  },

  async awardShareReward(): Promise<{ rewardPoints: number }> {
    return apiClient.post<{ rewardPoints: number }>("/dashboard/rewards/share");
  },
};

export default dashboardService;
