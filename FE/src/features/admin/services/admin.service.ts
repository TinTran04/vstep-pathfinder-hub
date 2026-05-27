import { apiClient } from "@/services/api-client";
import {
  User, Exam, PricePlan,
  initialPlans,
  usageData, monthlyUsageData, subscriptionPurchaseData, planDistData
} from "../mocks/admin.mock";
import { task1Samples, task2Samples, type SampleEssay } from "../../quiz/writing/mocks/writing.mock";

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

interface ImportReadingExamResponse {
  examId: number;
  title: string;
  totalSections: number;
  totalQuestions: number;
  warnings: { code: string; message: string; questionNumber?: number | null; sectionNumber?: number | null }[];
}

interface ImportListeningExamResponse {
  examId: number;
  title: string;
  audioUrl: string | null;
  totalSections: number;
  totalQuestions: number;
  warnings: { code: string; message: string; questionNumber?: number | null; sectionNumber?: number | null }[];
}

interface ListeningAudioUploadUrlResponse {
  uploadUrl: string;
  audioObjectKey: string;
  audioUrl: string;
  expiresAt: string;
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
  const plan = u.subscriptionPlan?.toLowerCase();
  if (plan === "weekly") {
    planName = "Gói Tuần";
  } else if (plan === "monthly") {
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
      description: `${payload.title} | mode:${payload.mode || "practice"}${groupSegment}${groupTitleSegment}`,
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
      description: `${payload.title || ""} | mode:${payload.mode || "practice"}${groupSegment}${groupTitleSegment}`,
      durationMinutes,
      isPublished: payload.status === "active",
      audioUrl: payload.audioUrl ?? null,
      imageUrl: null,
    };

    const res = await apiClient.put<BEExamResponse>(`/exams/${examId}`, bePayload);
    return toExam(res);
  },

  async deleteExam(examId: string): Promise<boolean> {
    await apiClient.delete(`/exams/${examId}`);
    return true;
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

  async importListeningDocx(file: File, audioUrl?: string | null, isPublished = false): Promise<{ exam: Exam; warnings: ImportListeningExamResponse["warnings"] }> {
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
    const dotIndex = file.name.lastIndexOf(".");
    const fileExtension = dotIndex >= 0 ? file.name.slice(dotIndex) : ".mp3";

    const uploadInfo = await apiClient.post<ListeningAudioUploadUrlResponse>("/exams/listening-audio/upload-url", {
      examId: Number(exam.id),
      contentType,
      fileExtension,
    });

    const uploadRes = await fetch(uploadInfo.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload audio failed: HTTP ${uploadRes.status}`);
    }

    return this.updateExam(exam.id, {
      ...exam,
      audioUrl: uploadInfo.audioUrl,
    });
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
