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
    "Luyện tập cả 4 kỹ năng Listening, Reading, Writing, Speaking",
    "1 đề thi thử miễn phí",
    "Xem đáp án sau khi nộp bài",
    "Hỗ trợ cộng đồng",
  ],
  weekly: [
    "Dành cho ôn thi ngắn hạn",
    "Chấm điểm AI không giới hạn",
    "Truy cập đầy đủ ngân hàng đề",
    "Phù hợp ôn nước rút trước kỳ thi",
  ],
  monthly: [
    "Chấm điểm AI không giới hạn",
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

  const features: string[] = [];

  if (plan.dailyPracticeLimit === null || plan.dailyPracticeLimit === undefined) {
    features.push("Luyện tập không giới hạn mỗi ngày");
  } else if (plan.dailyPracticeLimit > 0) {
    features.push(`${plan.dailyPracticeLimit} lượt luyện tập mỗi ngày`);
  }

  if (plan.canStoreSpeakingAudioForever) {
    features.push("Lưu audio Speaking không giới hạn thời gian");
  } else if (plan.speakingAudioRetentionDays > 0) {
    features.push(`Lưu audio Speaking ${plan.speakingAudioRetentionDays} ngày`);
  }

  if (plan.description) {
    const customFeatures = plan.description
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
    features.unshift(...customFeatures);
  }

  const finalFeatures = Array.from(new Set(features));
  const mappedFeatures = finalFeatures.length > 0 ? finalFeatures : ["Quyền lợi cơ bản"];

  return {
    subscriptionPlanId: plan.subscriptionPlanId,
    name: getDisplayName(plan.name),
    price: formatPrice(Number(plan.price)),
    rawPrice: Number(plan.price),
    period: getPeriod(plan),
    popular: plan.durationDays >= 28 && plan.durationDays <= 31 && plan.price > 0,
    features: mappedFeatures,
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
