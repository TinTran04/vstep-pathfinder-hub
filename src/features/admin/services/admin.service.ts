import { apiClient } from "@/services/api-client";
import {
  User, Exam, PricePlan,
  initialPlans
} from "../mocks/admin.mock";
import { task1Samples, task2Samples, type SampleEssay } from "../../quiz/writing/mocks/writing.mock";

export interface AdminStats {
  usageData: any[];
  monthlyUsageData: any[];
  subscriptionPurchaseData: any[];
  planDistData: any[];
  totalRevenue: number;
  monthlyGrowth: number;
  recentActivities: any[];
  weeklyData: number[];
}

let plansList = [...initialPlans];

// --- BE DTO Types ---
interface BEUserResponse {
  userId: number;
  fullName: string;
  email: string;
  roleId: number;
  role: string;
  subscriptionPlanId: number;
  subscriptionPlan: string;
  emailConfirmed: boolean;
  createdAt: string;
}

interface BEPagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BEExamResponse {
  examId: number;
  title: string;
  skillType: string;
  description: string;
  durationMinutes: number;
  audioUrl: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
}

interface BESubscriptionPlanResponse {
  subscriptionPlanId: number;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  dailyPracticeLimit: number | null;
  canStoreSpeakingAudioForever: boolean;
  speakingAudioRetentionDays: number;
  isActive: boolean;
}

interface SubscriptionPlanPayload {
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  dailyPracticeLimit: number | null;
  canStoreSpeakingAudioForever: boolean;
  speakingAudioRetentionDays: number;
  isActive: boolean;
}

export interface ListeningAudioUploadUrlRequest {
  examId?: number | null;
  contentType: string;
  fileExtension?: string | null;
}

export interface ListeningAudioUploadUrlResponse {
  uploadUrl: string;
  audioObjectKey: string;
  contentType: string;
  audioUrl: string;
  expiresAt: string;
}

interface ImportReadingExamResponse {
  examId: number;
  title: string;
  totalSections: number;
  totalQuestions: number;
  warnings: { code: string; message: string; questionNumber?: number | null; sectionNumber?: number | null }[];
}

export interface ImportListeningExamResponse {
  examId: number;
  title: string;
  audioUrl: string | null;
  totalSections: number;
  totalQuestions: number;
  warnings: { code: string; message: string; questionNumber?: number | null; sectionNumber?: number | null }[];
}

function getDurationMinutes(skillType: string): number {
  if (skillType === "listening") return 40;
  if (skillType === "reading") return 60;
  if (skillType === "writing") return 60;
  if (skillType === "speaking") return 12;
  return 45;
}

// --- Mappers ---
function toUser(u: BEUserResponse): User {
  let planName = "Miễn phí";
  const plan = u.subscriptionPlan?.toLowerCase().trim();
  if (plan === "weekly" || plan === "gói tuần") {
    planName = "Gói Tuần";
  } else if (plan === "monthly" || plan === "gói tháng") {
    planName = "Gói Tháng";
  }

  return {
    id: u.userId.toString(),
    name: u.fullName,
    email: u.email,
    role: u.role === "admin" ? "admin" : "student",
    status: u.emailConfirmed ? "active" : "inactive",
    createdAt: u.createdAt ? u.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
    examsCompleted: 0,
    plan: planName,
    lastActive: "Vừa xong",
    points: 0,
    streak: 0,
  };
}

function toExam(e: BEExamResponse): Exam {
  const skill = e.skillType ? e.skillType.charAt(0).toUpperCase() + e.skillType.slice(1).toLowerCase() : "Listening";
  
  let questions = 10;
  const lowerSkill = skill.toLowerCase();
  if (lowerSkill === "listening") questions = 35;
  else if (lowerSkill === "reading") questions = 40;
  else if (lowerSkill === "writing") questions = 2;
  else if (lowerSkill === "speaking") questions = 3;

  let groupId: string | undefined = undefined;
  let groupTitle: string | undefined = undefined;
  if (e.description) {
    const groupMatch = e.description.match(/group:([^;|\n]+)/);
    if (groupMatch) groupId = groupMatch[1];
    
    const titleMatch = e.description.match(/groupTitle:([^;|\n]+)/);
    if (titleMatch) groupTitle = titleMatch[1];
  }

  return {
    id: e.examId.toString(),
    title: e.title,
    description: e.description,
    skill: skill,
    difficulty: "Trung bình",
    questions: questions,
    status: e.isPublished ? "active" : "draft",
    uploadedAt: e.createdAt ? e.createdAt.replace("T", " ").slice(0, 16) : new Date().toISOString().replace("T", " ").slice(0, 16),
    audioUrl: e.audioUrl,
    mode: e.description && e.description.includes("mode:mock_test") ? "mock_test" : "practice",
    groupId,
    groupTitle,
  };
}

function getPlanDisplayName(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (normalized === "free") return "Miễn phí";
  if (normalized === "weekly" || normalized === "gói tuần") return "Gói Tuần";
  if (normalized === "monthly" || normalized === "gói tháng") return "Gói Tháng";
  return name;
}

function getPlanPeriod(plan: Pick<BESubscriptionPlanResponse, "price" | "durationDays">): string {
  if (plan.price <= 0 || plan.durationDays <= 0) return "Mãi mãi";
  if (plan.durationDays === 7) return "/tuần";
  if (plan.durationDays >= 28 && plan.durationDays <= 31) return "/tháng";
  return `/${plan.durationDays} ngày`;
}

function getPlanFeatures(plan: BESubscriptionPlanResponse): string[] {
  const features: string[] = [];

  if (plan.dailyPracticeLimit === null) {
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
  return finalFeatures.length > 0 ? finalFeatures : ["Quyền lợi cơ bản"];
}

function toPricePlan(plan: BESubscriptionPlanResponse): PricePlan {
  return {
    id: plan.subscriptionPlanId.toString(),
    name: getPlanDisplayName(plan.name),
    description: plan.description,
    price: plan.price,
    period: getPlanPeriod(plan),
    features: getPlanFeatures(plan),
    durationDays: plan.durationDays,
    dailyPracticeLimit: plan.dailyPracticeLimit,
    canStoreSpeakingAudioForever: plan.canStoreSpeakingAudioForever,
    speakingAudioRetentionDays: plan.speakingAudioRetentionDays,
    isActive: plan.isActive,
  };
}

function toSubscriptionPlanPayload(plan: Partial<PricePlan>): SubscriptionPlanPayload {
  return {
    name: plan.name?.trim() || "",
    description: plan.description?.trim() || null,
    price: Number(plan.price ?? 0),
    durationDays: Number(plan.durationDays ?? 30),
    dailyPracticeLimit: plan.dailyPracticeLimit === undefined ? null : plan.dailyPracticeLimit,
    canStoreSpeakingAudioForever: Boolean(plan.canStoreSpeakingAudioForever),
    speakingAudioRetentionDays: Number(plan.speakingAudioRetentionDays ?? 0),
    isActive: plan.isActive ?? true,
  };
}

export const adminService = {
  async getUsers(): Promise<User[]> {
    const res = await apiClient.get<BEPagedResponse<BEUserResponse>>("/users?pageSize=100");
    return (res.items ?? []).map(toUser);
  },

  async getExams(): Promise<Exam[]> {
    const res = await apiClient.get<BEPagedResponse<BEExamResponse>>("/exams?pageSize=100");
    return (res.items ?? []).map(toExam);
  },

  async getPricePlans(): Promise<PricePlan[]> {
    try {
      const res = await apiClient.get<BESubscriptionPlanResponse[]>("/subscription-plans/admin");
      return (res ?? []).map(toPricePlan);
    } catch (error) {
      console.warn("Fallback to mock subscription plans", error);
      return [...plansList];
    }
  },

  async getAdminStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>("/admin/stats");
  },

  // User CRUD
  async createUser(payload: Omit<User, "id" | "createdAt" | "examsCompleted" | "lastActive" | "points" | "streak">): Promise<User> {
    const roleId = payload.role === "admin" ? 1 : 3;
    let subscriptionPlanId = 1;
    if (payload.plan === "Gói Tuần") {
      subscriptionPlanId = 2;
    } else if (payload.plan === "Gói Tháng") {
      subscriptionPlanId = 3;
    }
    const emailConfirmed = payload.status === "active";

    const bePayload = {
      fullName: payload.name,
      email: payload.email,
      password: "Password123!",
      roleId,
      subscriptionPlanId,
      emailConfirmed,
    };
    
    const res = await apiClient.post<BEUserResponse>("/users", bePayload);
    return toUser(res);
  },

  async updateUser(userId: string, payload: Partial<User>): Promise<User> {
    const roleId = payload.role === "admin" ? 1 : 3;
    let subscriptionPlanId = 1;
    if (payload.plan === "Gói Tuần") {
      subscriptionPlanId = 2;
    } else if (payload.plan === "Gói Tháng") {
      subscriptionPlanId = 3;
    }
    const emailConfirmed = payload.status === "active";

    const bePayload = {
      fullName: payload.name,
      roleId,
      subscriptionPlanId,
      emailConfirmed,
    };

    const res = await apiClient.put<BEUserResponse>(`/users/${userId}`, bePayload);
    return toUser(res);
  },

  async deleteUser(userId: string): Promise<boolean> {
    await apiClient.delete(`/users/${userId}`);
    return true;
  },

  // Exam CRUD
  async createExam(payload: Omit<Exam, "id" | "uploadedAt">): Promise<Exam> {
    const skillType = payload.skill.toLowerCase();
    const durationMinutes = getDurationMinutes(skillType);

    const groupSegment = payload.groupId ? `;group:${payload.groupId}` : "";
    const groupTitleSegment = payload.groupTitle ? `;groupTitle:${payload.groupTitle}` : "";

    const bePayload = {
      title: payload.title,
      skillType: skillType,
      description: payload.description ?? `${payload.title} | mode:${payload.mode || "practice"}${groupSegment}${groupTitleSegment}`,
      durationMinutes,
      isPublished: payload.status === "active",
      audioUrl: payload.audioUrl ?? null,
      imageUrl: null,
    };

    const res = await apiClient.post<BEExamResponse>("/exams", bePayload);
    return toExam(res);
  },

  async updateExam(examId: string, payload: Partial<Exam>): Promise<Exam> {
    const skillType = payload.skill?.toLowerCase() || "listening";
    const durationMinutes = getDurationMinutes(skillType);

    const groupSegment = payload.groupId ? `;group:${payload.groupId}` : "";
    const groupTitleSegment = payload.groupTitle ? `;groupTitle:${payload.groupTitle}` : "";

    const bePayload = {
      title: payload.title || "",
      skillType: skillType,
      description: payload.description ?? `${payload.title || ""} | mode:${payload.mode || "practice"}${groupSegment}${groupTitleSegment}`,
      durationMinutes,
      isPublished: payload.status === "active",
      audioUrl: payload.audioUrl ?? undefined,
      imageUrl: null,
    };

    const res = await apiClient.put<BEExamResponse>(`/exams/${examId}`, bePayload);
    return toExam(res);
  },

  async deleteExam(examId: string): Promise<boolean> {
    await apiClient.delete(`/exams/${examId}`);
    return true;
  },

  async createListeningAudioUploadUrl(
    request: ListeningAudioUploadUrlRequest
  ): Promise<ListeningAudioUploadUrlResponse> {
    return apiClient.post<ListeningAudioUploadUrlResponse>(
      "/exams/listening-audio/upload-url",
      request
    );
  },

  async importReadingDocx(file: File, isPublished = false): Promise<{ exam: Exam; warnings: ImportReadingExamResponse["warnings"] }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPublished", String(isPublished));

    const res = await apiClient.upload<ImportReadingExamResponse>("/exams/import-reading-docx", formData);
    return {
      exam: {
        id: res.examId.toString(),
        title: res.title,
        skill: "Reading",
        difficulty: "Trung bình",
        questions: res.totalQuestions,
        status: isPublished ? "active" : "draft",
        uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      },
      warnings: res.warnings ?? [],
    };
  },

  async uploadListeningAudioToR2(
    uploadUrl: string,
    file: File,
    contentType: string
  ): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`Upload audio failed: HTTP ${res.status}`);
    }
  },

  async importListeningDocx(
    file: File,
    audioUrl?: string | null,
    isPublished = false
  ): Promise<{ exam: Exam; warnings: ImportListeningExamResponse["warnings"] }> {
    const formData = new FormData();
    formData.append("file", file);
    if (audioUrl) {
      formData.append("audioUrl", audioUrl);
    }
    formData.append("isPublished", String(isPublished));

    const res = await apiClient.upload<ImportListeningExamResponse>("/exams/import-listening-docx", formData);
    return {
      exam: {
        id: res.examId.toString(),
        title: res.title,
        skill: "Listening",
        difficulty: "Trung bình",
        questions: res.totalQuestions,
        status: isPublished ? "active" : "draft",
        uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        audioUrl: res.audioUrl,
      },
      warnings: res.warnings ?? [],
    };
  },

  async uploadListeningAudio(exam: Exam, file: File): Promise<Exam> {
    const contentType = file.type || "audio/mpeg";
    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
    const uploadInfo = await this.createListeningAudioUploadUrl({
      examId: Number(exam.id),
      contentType,
      fileExtension,
    });

    await this.uploadListeningAudioToR2(uploadInfo.uploadUrl, file, uploadInfo.contentType);

    return this.updateExam(exam.id, {
      ...exam,
      audioUrl: uploadInfo.audioUrl,
    });
  },

  async uploadAudioAndImportListeningDocx(
    docxFile: File,
    audioFile: File,
    isPublished: boolean
  ): Promise<{ exam: Exam; warnings: ImportListeningExamResponse["warnings"] }> {
    const contentType = audioFile.type || "audio/mpeg";
    const fileExtension = audioFile.name.split(".").pop()?.toLowerCase() ?? "mp3";
    const uploadInfo = await this.createListeningAudioUploadUrl({
      examId: null,
      contentType,
      fileExtension,
    });

    await this.uploadListeningAudioToR2(uploadInfo.uploadUrl, audioFile, uploadInfo.contentType);
    return this.importListeningDocx(docxFile, uploadInfo.audioUrl, isPublished);
  },
  // Price Plan CRUD
  async createPricePlan(payload: Partial<PricePlan>): Promise<PricePlan> {
    const res = await apiClient.post<BESubscriptionPlanResponse>(
      "/subscription-plans",
      toSubscriptionPlanPayload(payload)
    );
    return toPricePlan(res);
  },

  async updatePricePlan(planId: string, payload: Partial<PricePlan>): Promise<PricePlan> {
    // Do NOT use stale mock plansList — only use the payload from the caller
    const res = await apiClient.put<BESubscriptionPlanResponse>(
      `/subscription-plans/${planId}`,
      toSubscriptionPlanPayload(payload)
    );
    return toPricePlan(res);
  },

  async deletePricePlan(planId: string): Promise<boolean> {
    await apiClient.delete(`/subscription-plans/${planId}`);
    return true;
  },

  // Writing Sample CRUD
  async getWritingSamples(): Promise<{ task1Samples: SampleEssay[]; task2Samples: SampleEssay[] }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const stored = localStorage.getItem("vstep_writing_samples");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing writing samples", e);
      }
    }
    const data = { task1Samples, task2Samples };
    localStorage.setItem("vstep_writing_samples", JSON.stringify(data));
    return data;
  },

  async createWritingSample(payload: Omit<SampleEssay, "id"> & { taskType: "task1" | "task2" }): Promise<SampleEssay> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const data = await this.getWritingSamples();
    const newSample: SampleEssay = {
      id: Date.now(),
      level: payload.level,
      score: payload.score,
      content: payload.content,
      reasons: payload.reasons,
    };
    if (payload.taskType === "task1") {
      data.task1Samples.push(newSample);
    } else {
      data.task2Samples.push(newSample);
    }
    localStorage.setItem("vstep_writing_samples", JSON.stringify(data));
    return newSample;
  },

  async updateWritingSample(id: number, payload: Partial<SampleEssay>): Promise<SampleEssay> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const data = await this.getWritingSamples();
    let updated: SampleEssay | null = null;
    
    const t1Index = data.task1Samples.findIndex((x) => x.id === id);
    if (t1Index !== -1) {
      data.task1Samples[t1Index] = { ...data.task1Samples[t1Index], ...payload };
      updated = data.task1Samples[t1Index];
    } else {
      const t2Index = data.task2Samples.findIndex((x) => x.id === id);
      if (t2Index !== -1) {
        data.task2Samples[t2Index] = { ...data.task2Samples[t2Index], ...payload };
        updated = data.task2Samples[t2Index];
      }
    }
    
    if (!updated) throw new Error("Sample not found");
    localStorage.setItem("vstep_writing_samples", JSON.stringify(data));
    return updated;
  },

  async deleteWritingSample(id: number): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const data = await this.getWritingSamples();
    data.task1Samples = data.task1Samples.filter((x) => x.id !== id);
    data.task2Samples = data.task2Samples.filter((x) => x.id !== id);
    localStorage.setItem("vstep_writing_samples", JSON.stringify(data));
    return true;
  },
};

export default adminService;

