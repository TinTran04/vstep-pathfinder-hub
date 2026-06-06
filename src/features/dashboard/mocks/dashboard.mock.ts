import {
  BookOpen, FileText, Star, Flame, Share2, Gift
} from "lucide-react";

export const recentScores = [
  { skill: "Listening", test: "Đề thi thử #5", score: 7.5, total: 10, date: "28/02/2026" },
  { skill: "Reading", test: "Đề thi thử #3", score: 8, total: 10, date: "27/02/2026" },
  { skill: "Writing", test: "Task 2 - Essay", score: 6.5, total: 10, date: "26/02/2026" },
  { skill: "Speaking", test: "Part 3 - Discussion", score: 7, total: 10, date: "25/02/2026" },
];

export const weeklyData = [
  { day: "T2", hours: 1.5 },
  { day: "T3", hours: 2 },
  { day: "T4", hours: 0.5 },
  { day: "T5", hours: 2.5 },
  { day: "T6", hours: 1 },
  { day: "T7", hours: 3 },
  { day: "CN", hours: 2 },
];

export const streakDays = [true, true, true, true, true, true, true, true, true, true, true, true, false, false];

export const pointActions = [
  { action: "Hoàn thành 1 bài học", points: 10, icon: BookOpen },
  { action: "Hoàn thành 1 đề thi", points: 25, icon: FileText },
  { action: "Đạt điểm ≥ 7.0", points: 15, icon: Star },
  { action: "Duy trì streak 7 ngày", points: 50, icon: Flame },
  { action: "Chia sẻ website", points: 30, icon: Share2 },
  { action: "Mời bạn bè đăng ký", points: 100, icon: Gift },
];

