import { apiClient } from "@/services/api-client";
import { benefits, testimonials, plans } from "../mocks/landing.mock";

export interface PlanItem {
  subscriptionPlanId: number;
  name: string;
  price: string;
  rawPrice: number;
  period: string;
  popular: boolean;
  features: string[];
  durationDays: number;
}

interface BackendSubscriptionPlan {
  subscriptionPlanId: number;
  name: string;
  description?: string | null;
  price: number;
  durationDays: number;
  dailyPracticeLimit?: number | null;
  canStoreSpeakingAudioForever: boolean;
  speakingAudioRetentionDays: number;
}

const planFeatures: Record<string, string[]> = {
  free: [
    "Truy cập 10 bài học cơ bản",
    "1 đề thi thử miễn phí",
    "Xem lộ trình học tổng quan",
    "Hỗ trợ cộng đồng",
  ],
  weekly: [
    "Dành cho ôn thi ngắn hạn",
    "Chấm điểm AI không giới hạn",
    "Truy cập đầy đủ ngân hàng đề",
    "Lộ trình học cá nhân hoá",
    "Phù hợp ôn nước rút trước kỳ thi",
  ],
  monthly: [
    "Chấm điểm AI không giới hạn",
    "Lộ trình học cá nhân hoá",
    "Toàn bộ bài học 4 kỹ năng",
    "Truy cập đầy đủ ngân hàng đề",
    "Dashboard theo dõi tiến độ",
    "Feedback Speaking & Writing từ AI",
  ],
};

const formatPrice = (price: number): string => {
  if (price <= 0) return "0đ";
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
};

const getDisplayName = (name: string): string => {
  const normalized = name.toLowerCase();
  if (normalized === "free") return "Miễn phí";
  if (normalized === "weekly") return "Gói Tuần";
  if (normalized === "monthly") return "Gói Tháng";
  return name;
};

const getPeriod = (plan: BackendSubscriptionPlan): string => {
  if (plan.price <= 0 || plan.durationDays <= 0) return "Mãi mãi";
  if (plan.durationDays >= 30) return "/tháng";
  if (plan.durationDays >= 7) return "/tuần";
  return `/${plan.durationDays} ngày`;
};

const mapPlan = (plan: BackendSubscriptionPlan): PlanItem => {
  const key = plan.name.toLowerCase();

  return {
    subscriptionPlanId: plan.subscriptionPlanId,
    name: getDisplayName(plan.name),
    price: formatPrice(Number(plan.price)),
    rawPrice: Number(plan.price),
    period: getPeriod(plan),
    popular: key === "monthly",
    features: planFeatures[key] || [plan.description || "Gói học VSTEP"],
    durationDays: plan.durationDays,
  };
};

export const landingService = {
  async getBenefits() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return benefits;
  },

  async getTestimonials() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const stored = localStorage.getItem("vstep_testimonials");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing testimonials", e);
      }
    }
    localStorage.setItem("vstep_testimonials", JSON.stringify(testimonials));
    return testimonials;
  },

  async createTestimonial(payload: { name: string; role: string; content: string; rating: number }) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const current = await this.getTestimonials();
    const newTestimonial = {
      ...payload,
      rating: Number(payload.rating),
    };
    current.unshift(newTestimonial);
    localStorage.setItem("vstep_testimonials", JSON.stringify(current));
    return newTestimonial;
  },

  async getPlans(): Promise<PlanItem[]> {
    try {
      const apiPlans = await apiClient.get<BackendSubscriptionPlan[]>("/subscription-plans");
      return apiPlans.map(mapPlan);
    } catch (error) {
      console.warn("Falling back to mocked subscription plans", error);
      await new Promise((resolve) => setTimeout(resolve, 200));
      return plans as PlanItem[];
    }
  },

  async getLandingData() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      benefits,
      testimonials,
      plans: await this.getPlans(),
    };
  },
};

export default landingService;
