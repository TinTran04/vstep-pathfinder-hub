import {
  User, Exam, PricePlan,
  initialUsers, initialExams, initialPlans,
  usageData, monthlyUsageData, subscriptionPurchaseData, planDistData
} from "../mocks/admin.mock";

let usersList = [...initialUsers];
let examsList = [...initialExams];
let plansList = [...initialPlans];

export const adminService = {
  async getUsers(): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...usersList];
  },

  async getExams(): Promise<Exam[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...examsList];
  },

  async getPricePlans(): Promise<PricePlan[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...plansList];
  },

  async getAdminStats() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      usageData,
      monthlyUsageData,
      subscriptionPurchaseData,
      planDistData,
      totalRevenue: 4850000,
      monthlyGrowth: 23,
      recentActivities: [
        { text: "Võ Thị F hoàn thành Speaking #1 — 8.0/10", time: "2 phút trước", type: "exam" as const },
        { text: "Đề thi Reading #2 được thêm mới", time: "1 giờ trước", type: "add" as const },
        { text: "Trần Thị B đăng ký Gói Tháng", time: "2 giờ trước", type: "payment" as const },
        { text: "Hoàng Minh E đạt 8.5/10 Writing #1", time: "3 giờ trước", type: "exam" as const },
        { text: "Nguyễn Văn A hoàn thành Listening #2", time: "4 giờ trước", type: "exam" as const },
        { text: "Đặng Quốc G đăng ký tài khoản mới", time: "5 giờ trước", type: "user" as const },
      ],
      weeklyData: [12, 18, 8, 22, 15, 28, 20],
    };
  },

  // User CRUD
  async createUser(payload: Omit<User, "id" | "createdAt" | "examsCompleted" | "lastActive" | "points" | "streak">): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newUser: User = {
      ...payload,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
      examsCompleted: 0,
      lastActive: "Vừa xong",
      points: 0,
      streak: 0,
    };
    usersList.push(newUser);
    return newUser;
  },

  async updateUser(userId: string, payload: Partial<User>): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = usersList.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error("User not found");
    usersList[index] = { ...usersList[index], ...payload };
    return usersList[index];
  },

  async deleteUser(userId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    usersList = usersList.filter((u) => u.id !== userId);
    return true;
  },

  // Exam CRUD
  async createExam(payload: Omit<Exam, "id" | "uploadedAt">): Promise<Exam> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const now = new Date();
    const timeStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().slice(0, 5)}`;
    const newExam: Exam = {
      ...payload,
      id: Date.now().toString(),
      uploadedAt: timeStr,
    };
    examsList.push(newExam);
    return newExam;
  },

  async updateExam(examId: string, payload: Partial<Exam>): Promise<Exam> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = examsList.findIndex((e) => e.id === examId);
    if (index === -1) throw new Error("Exam not found");
    examsList[index] = { ...examsList[index], ...payload };
    return examsList[index];
  },

  async deleteExam(examId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    examsList = examsList.filter((e) => e.id !== examId);
    return true;
  },

  // Price Plan CRUD
  async createPricePlan(payload: Omit<PricePlan, "id">): Promise<PricePlan> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newPlan: PricePlan = {
      ...payload,
      id: Date.now().toString(),
    };
    plansList.push(newPlan);
    return newPlan;
  },

  async updatePricePlan(planId: string, payload: Partial<PricePlan>): Promise<PricePlan> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = plansList.findIndex((p) => p.id === planId);
    if (index === -1) throw new Error("Plan not found");
    plansList[index] = { ...plansList[index], ...payload };
    return plansList[index];
  },

  async deletePricePlan(planId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    plansList = plansList.filter((p) => p.id !== planId);
    return true;
  },
};

export default adminService;
