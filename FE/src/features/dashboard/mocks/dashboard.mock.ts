import {
  BookOpen, FileText, Star, Flame, Share2, Gift, Award, Sparkles, Ticket, Crown, Trophy, CreditCard
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

// Rewards store - from low to high, with monthly limits
export const rewardsStore = [
  { id: 1, name: "Badge 'Người mới'", description: "Huy hiệu hiển thị trên hồ sơ", cost: 50, icon: Award, category: "badge", emoji: "🏅", monthlyLimit: 1 },
  { id: 2, name: "1 đề thi Premium", description: "Mở khóa 1 đề thi nâng cao", cost: 100, icon: FileText, category: "test", emoji: "📝", monthlyLimit: 5 },
  { id: 3, name: "Badge 'Chăm chỉ'", description: "Huy hiệu học viên chăm chỉ", cost: 200, icon: Star, category: "badge", emoji: "⭐", monthlyLimit: 1 },
  { id: 4, name: "3 lượt chấm AI Writing", description: "Chấm bài viết bằng AI", cost: 300, icon: Sparkles, category: "ai", emoji: "🤖", monthlyLimit: 3 },
  { id: 5, name: "Giảm 10% gói Tháng", description: "Mã giảm giá cho gói Premium", cost: 500, icon: Ticket, category: "discount", emoji: "🎫", monthlyLimit: 2 },
  { id: 6, name: "1 tuần Premium miễn phí", description: "Trải nghiệm Premium 7 ngày", cost: 800, icon: Crown, category: "premium", emoji: "👑", monthlyLimit: 1 },
  { id: 7, name: "Badge 'Chiến binh VSTEP'", description: "Huy hiệu cực hiếm", cost: 1000, icon: Trophy, category: "badge", emoji: "🏆", monthlyLimit: 1 },
  { id: 8, name: "AI Writing không giới hạn (1 tháng)", description: "Chấm bài không giới hạn trong 30 ngày", cost: 1500, icon: Sparkles, category: "ai", emoji: "✨", monthlyLimit: 1 },
  { id: 9, name: "Giảm 30% gói Năm", description: "Mã giảm giá lớn cho gói Premium", cost: 2000, icon: CreditCard, category: "discount", emoji: "💳", monthlyLimit: 1 },
  { id: 10, name: "VIP Lifetime Badge", description: "Huy hiệu VIP vĩnh viễn trên hồ sơ", cost: 3000, icon: Crown, category: "badge", emoji: "💎", monthlyLimit: 1 },
];
