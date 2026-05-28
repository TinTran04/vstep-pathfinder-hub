// --- Types ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  status: "active" | "inactive";
  createdAt: string;
  examsCompleted: number;
  plan: string;
  lastActive: string;
  points: number;
  streak: number;
}

export interface Exam {
  id: string;
  title: string;
  skill: string;
  difficulty: string;
  questions: number;
  status: "active" | "draft";
  uploadedAt: string;
  audioUrl?: string | null;
}

export interface PricePlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
}

// --- Mock data ---
export const initialUsers: User[] = [
  { id: "1", name: "Nguyễn Văn A", email: "a@email.com", role: "student", status: "active", createdAt: "2026-01-15", examsCompleted: 12, plan: "Gói Tháng", lastActive: "2 phút trước", points: 350, streak: 12 },
  { id: "2", name: "Trần Thị B", email: "b@email.com", role: "student", status: "active", createdAt: "2026-02-01", examsCompleted: 8, plan: "Gói Tháng", lastActive: "1 giờ trước", points: 210, streak: 5 },
  { id: "3", name: "Lê Văn C", email: "c@email.com", role: "admin", status: "active", createdAt: "2025-12-10", examsCompleted: 0, plan: "Admin", lastActive: "Đang online", points: 0, streak: 0 },
  { id: "4", name: "Phạm Thị D", email: "d@email.com", role: "student", status: "inactive", createdAt: "2026-01-20", examsCompleted: 3, plan: "Miễn phí", lastActive: "5 ngày trước", points: 45, streak: 0 },
  { id: "5", name: "Hoàng Minh E", email: "e@email.com", role: "student", status: "active", createdAt: "2026-02-15", examsCompleted: 15, plan: "Gói Tháng", lastActive: "30 phút trước", points: 520, streak: 8 },
  { id: "6", name: "Võ Thị F", email: "f@email.com", role: "student", status: "active", createdAt: "2026-02-20", examsCompleted: 22, plan: "Gói Tháng", lastActive: "10 phút trước", points: 780, streak: 15 },
  { id: "7", name: "Đặng Quốc G", email: "g@email.com", role: "student", status: "active", createdAt: "2026-02-25", examsCompleted: 6, plan: "Gói Tuần", lastActive: "3 giờ trước", points: 120, streak: 3 },
];

export const initialExams: Exam[] = [
  { id: "1", title: "Đề thi Listening #1", skill: "Listening", difficulty: "Dễ", questions: 35, status: "active", uploadedAt: "2026-02-15 10:30" },
  { id: "2", title: "Đề thi Reading #1", skill: "Reading", difficulty: "Trung bình", questions: 40, status: "active", uploadedAt: "2026-02-18 14:00" },
  { id: "3", title: "Đề thi Writing #1", skill: "Writing", difficulty: "Khó", questions: 2, status: "draft", uploadedAt: "2026-02-20 09:15" },
  { id: "4", title: "Đề thi Speaking #1", skill: "Speaking", difficulty: "Trung bình", questions: 3, status: "active", uploadedAt: "2026-02-22 16:45" },
  { id: "5", title: "Đề thi Listening #2", skill: "Listening", difficulty: "Trung bình", questions: 35, status: "active", uploadedAt: "2026-02-25 08:00" },
  { id: "6", title: "Đề thi Reading #2", skill: "Reading", difficulty: "Khó", questions: 40, status: "draft", uploadedAt: "2026-02-28 11:30" },
];

export const initialPlans: PricePlan[] = [
  { id: "1", name: "Miễn phí", price: 0, period: "Mãi mãi", features: ["Truy cập 10 bài học cơ bản", "1 đề thi thử miễn phí"] },
  { id: "2", name: "Gói Tháng", price: 199000, period: "/tháng", features: ["Unlimited AI scoring", "Lộ trình học cá nhân hoá", "Toàn bộ đề thi"] },
  { id: "3", name: "Gói Tuần", price: 49000, period: "/tuần", features: ["Ôn thi ngắn hạn", "Truy cập đầy đủ đề thi", "AI scoring"] },
];

// Usage chart data
export const usageData = [
  { name: "T2", users: 45, exams: 12 },
  { name: "T3", users: 52, exams: 18 },
  { name: "T4", users: 38, exams: 8 },
  { name: "T5", users: 65, exams: 22 },
  { name: "T6", users: 48, exams: 15 },
  { name: "T7", users: 72, exams: 28 },
  { name: "CN", users: 58, exams: 20 },
];

export const monthlyUsageData = [
  { name: "T1", users: 320 },
  { name: "T2", users: 480 },
  { name: "T3", users: 620 },
];

// Subscription purchase data
export const subscriptionPurchaseData = [
  { month: "T10", free: 12, weekly: 5, monthly: 8 },
  { month: "T11", free: 15, weekly: 7, monthly: 12 },
  { month: "T12", free: 18, weekly: 9, monthly: 15 },
  { month: "T1", free: 22, weekly: 11, monthly: 18 },
  { month: "T2", free: 28, weekly: 14, monthly: 22 },
  { month: "T3", free: 35, weekly: 16, monthly: 28 },
];

export const planDistData = [
  { name: "Miễn phí", value: 2, fill: "hsl(var(--muted-foreground))" },
  { name: "Gói Tuần", value: 1, fill: "hsl(210, 80%, 55%)" },
  { name: "Gói Tháng", value: 4, fill: "hsl(var(--primary))" },
];
