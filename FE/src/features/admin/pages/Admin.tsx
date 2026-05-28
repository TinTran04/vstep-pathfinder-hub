import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, DollarSign, Plus, Trash2, Edit2, Search,
  Save, Clock, TrendingUp, BookOpen, Activity, ArrowUpRight, BarChart3,
  LogOut, Bell, ChevronUp, ChevronDown, Eye, MoreHorizontal, CalendarDays,
  GraduationCap, Headphones, BookOpenCheck, Mic, PenTool, X, Upload,
  FileAudio, Image, ArrowLeft, Flame, Star, Crown, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import logoImg from "@/assets/logo.png";

import { User, Exam, PricePlan } from "../mocks/admin.mock";
import { SampleEssay } from "@/features/quiz/writing/mocks/writing.mock";
import { adminService } from "../services/admin.service";

type Tab = "dashboard" | "users" | "exams" | "pricing" | "sample-answers";

export interface AdminStats {
  usageData: { name: string; users: number; exams: number }[];
  monthlyUsageData: { name: string; users: number }[];
  subscriptionPurchaseData: { month: string; free: number; weekly: number; monthly: number }[];
  planDistData: { name: string; value: number; fill: string }[];
  totalRevenue: number;
  monthlyGrowth: number;
  recentActivities: { text: string; time: string; type: "exam" | "add" | "payment" | "user" }[];
  weeklyData: number[];
}

const sidebarItems = [
  { title: "Tổng quan", value: "dashboard" as Tab, icon: LayoutDashboard },
  { title: "Tài khoản", value: "users" as Tab, icon: Users },
  { title: "Đề thi", value: "exams" as Tab, icon: FileText },
  { title: "Bài viết mẫu", value: "sample-answers" as Tab, icon: BookOpen },
  { title: "Quản lí giá", value: "pricing" as Tab, icon: DollarSign },
];

const skillIcons: Record<string, typeof Headphones> = {
  Listening: Headphones, Reading: BookOpenCheck, Writing: PenTool, Speaking: Mic,
};
const skillColors: Record<string, string> = {
  Listening: "bg-blue-500/10 text-blue-600",
  Reading: "bg-emerald-500/10 text-emerald-600",
  Writing: "bg-amber-500/10 text-amber-600",
  Speaking: "bg-purple-500/10 text-purple-600",
};

const MAX_LISTENING_AUDIO_SIZE = 50 * 1024 * 1024;
const LISTENING_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
]);
const LISTENING_AUDIO_EXTENSIONS = new Set(["mp3", "wav", "webm", "ogg", "m4a"]);

function getFileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function isValidListeningAudio(file: File): boolean {
  const extension = getFileExtension(file);
  return LISTENING_AUDIO_TYPES.has(file.type) || LISTENING_AUDIO_EXTENSIONS.has(extension);
}

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [plans, setPlans] = useState<PricePlan[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [writingSamples, setWritingSamples] = useState<{ task1Samples: SampleEssay[]; task2Samples: SampleEssay[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      adminService.getUsers(),
      adminService.getExams(),
      adminService.getPricePlans(),
      adminService.getAdminStats(),
      adminService.getWritingSamples(),
    ]).then(([fetchedUsers, fetchedExams, fetchedPlans, fetchedStats, fetchedSamples]) => {
      if (isMounted) {
        setUsers(fetchedUsers);
        setExams(fetchedExams);
        setPlans(fetchedPlans);
        setStats(fetchedStats);
        setWritingSamples(fetchedSamples);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [searchUser, setSearchUser] = useState("");
  const [searchExam, setSearchExam] = useState("");

  // Filter states for Users
  const [filterUserRole, setFilterUserRole] = useState("all");
  const [filterUserPlan, setFilterUserPlan] = useState("all");
  const [filterUserStatus, setFilterUserStatus] = useState("all");

  // Filter states for Exams
  const [filterExamSkill, setFilterExamSkill] = useState("all");
  const [filterExamDifficulty, setFilterExamDifficulty] = useState("all");
  const [filterExamStatus, setFilterExamStatus] = useState("all");

  const [userDialog, setUserDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "student" as "admin" | "student", status: "active" as "active" | "inactive", plan: "Miễn phí" });

  // User detail view
  const [viewUser, setViewUser] = useState<User | null>(null);

  // Exam creation: step-based
  const [examDialog, setExamDialog] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [examStep, setExamStep] = useState<"skill" | "form">("skill");
  const [examForm, setExamForm] = useState({ title: "", skill: "Listening", difficulty: "Dễ", questions: 10, status: "draft" as "active" | "draft" });

  const [listeningDocxFile, setListeningDocxFile] = useState<File | null>(null);
  const [listeningAudioFile, setListeningAudioFile] = useState<File | null>(null);
  const [isImportingListening, setIsImportingListening] = useState(false);

  const [priceDialog, setPriceDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<PricePlan | null>(null);
  const [priceForm, setPriceForm] = useState({ name: "", price: 0, period: "/tháng", features: "" });

  // Writing Sample states
  const [sampleDialog, setSampleDialog] = useState(false);
  const [editSample, setEditSample] = useState<(SampleEssay & { taskType: "task1" | "task2" }) | null>(null);
  const [sampleForm, setSampleForm] = useState<{
    taskType: "task1" | "task2";
    level: "B1" | "B2";
    score: string;
    content: string;
    reasons: string[];
  }>({
    taskType: "task1",
    level: "B2",
    score: "8.0/10",
    content: "",
    reasons: [""]
  });

  const [searchSample, setSearchSample] = useState("");
  const [filterSampleTask, setFilterSampleTask] = useState("all");
  const [filterSampleLevel, setFilterSampleLevel] = useState("all");

  const openAddSample = () => {
    setEditSample(null);
    setSampleForm({
      taskType: "task1",
      level: "B2",
      score: "8.0/10",
      content: "",
      reasons: [""]
    });
    setSampleDialog(true);
  };

  const openEditSample = (s: SampleEssay, taskType: "task1" | "task2") => {
    setEditSample({ ...s, taskType });
    setSampleForm({
      taskType: taskType,
      level: s.level,
      score: s.score,
      content: s.content,
      reasons: s.reasons.length > 0 ? [...s.reasons] : [""]
    });
    setSampleDialog(true);
  };

  const saveSample = async () => {
    if (!sampleForm.content || !sampleForm.score) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    const filteredReasons = sampleForm.reasons.filter(r => r.trim() !== "");
    if (filteredReasons.length === 0) {
      toast.error("Vui lòng nhập ít nhất một lý do chấm điểm");
      return;
    }

    try {
      if (editSample) {
        if (editSample.taskType !== sampleForm.taskType) {
          await adminService.deleteWritingSample(editSample.id);
          const created = await adminService.createWritingSample({
            taskType: sampleForm.taskType,
            level: sampleForm.level,
            score: sampleForm.score,
            content: sampleForm.content,
            reasons: filteredReasons
          });
          const fetched = await adminService.getWritingSamples();
          setWritingSamples(fetched);
        } else {
          const updated = await adminService.updateWritingSample(editSample.id, {
            level: sampleForm.level,
            score: sampleForm.score,
            content: sampleForm.content,
            reasons: filteredReasons
          });
          setWritingSamples(p => {
            if (!p) return p;
            if (sampleForm.taskType === "task1") {
              return {
                ...p,
                task1Samples: p.task1Samples.map(x => x.id === editSample.id ? updated : x)
              };
            } else {
              return {
                ...p,
                task2Samples: p.task2Samples.map(x => x.id === editSample.id ? updated : x)
              };
            }
          });
        }
        toast.success("Cập nhật bài mẫu thành công");
      } else {
        const created = await adminService.createWritingSample({
          taskType: sampleForm.taskType,
          level: sampleForm.level,
          score: sampleForm.score,
          content: sampleForm.content,
          reasons: filteredReasons
        });
        setWritingSamples(p => {
          if (!p) return p;
          if (sampleForm.taskType === "task1") {
            return {
              ...p,
              task1Samples: [...p.task1Samples, created]
            };
          } else {
            return {
              ...p,
              task2Samples: [...p.task2Samples, created]
            };
          }
        });
        toast.success("Thêm bài mẫu thành công");
      }
      setSampleDialog(false);
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu bài mẫu");
    }
  };

  const deleteSample = async (id: number) => {
    try {
      await adminService.deleteWritingSample(id);
      setWritingSamples(p => {
        if (!p) return p;
        return {
          task1Samples: p.task1Samples.filter(x => x.id !== id),
          task2Samples: p.task2Samples.filter(x => x.id !== id)
        };
      });
      toast.success("Xóa bài mẫu thành công");
    } catch (err) {
      toast.error("Có lỗi xảy ra khi xóa bài mẫu");
    }
  };

  const addReasonField = () => {
    setSampleForm(p => ({
      ...p,
      reasons: [...p.reasons, ""]
    }));
  };

  const removeReasonField = (index: number) => {
    setSampleForm(p => ({
      ...p,
      reasons: p.reasons.filter((_, i) => i !== index)
    }));
  };

  const updateReasonField = (index: number, val: string) => {
    setSampleForm(p => {
      const copy = [...p.reasons];
      copy[index] = val;
      return {
        ...p,
        reasons: copy
      };
    });
  };

  // User CRUD
  const openAddUser = () => { setEditUser(null); setUserForm({ name: "", email: "", role: "student", status: "active", plan: "Miễn phí" }); setUserDialog(true); };
  const openEditUser = (u: User) => { setEditUser(u); setUserForm({ name: u.name, email: u.email, role: u.role, status: u.status, plan: u.plan }); setUserDialog(true); };
  
  const saveUser = async () => {
    if (!userForm.name || !userForm.email) { toast.error("Vui lòng điền đầy đủ"); return; }
    if (editUser) {
      try {
        const updated = await adminService.updateUser(editUser.id, userForm);
        setUsers(p => p.map(u => u.id === editUser.id ? updated : u));
        toast.success("Cập nhật thành công");
      } catch (err) {
        toast.error("Có lỗi xảy ra");
      }
    } else {
      try {
        const created = await adminService.createUser(userForm);
        setUsers(p => [...p, created]);
        toast.success("Thêm thành công");
      } catch (err) {
        toast.error("Có lỗi xảy ra");
      }
    }
    setUserDialog(false);
  };
  
  const deleteUser = async (id: string) => {
    try {
      await adminService.deleteUser(id);
      setUsers(p => p.filter(u => u.id !== id));
      toast.success("Xóa thành công");
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
  };

  // Exam CRUD — step-based
  const resetListeningImportFiles = () => {
    setListeningDocxFile(null);
    setListeningAudioFile(null);
  };

  const openAddExam = () => { setEditExam(null); setExamStep("skill"); setExamForm({ title: "", skill: "Listening", difficulty: "Dễ", questions: 10, status: "draft" }); resetListeningImportFiles(); setExamDialog(true); };
  const openEditExam = (e: Exam) => { setEditExam(e); setExamStep("form"); setExamForm({ title: e.title, skill: e.skill, difficulty: e.difficulty, questions: e.questions, status: e.status }); setExamDialog(true); };
  const selectSkillForExam = (skill: string) => { resetListeningImportFiles(); setExamForm(p => ({ ...p, skill, questions: skill === "Listening" ? 35 : p.questions })); setExamStep("form"); };
  
  const saveExam = async () => {
    if (!editExam && examForm.skill === "Listening") {
      if (!listeningDocxFile) {
        toast.error("Vui lòng chọn file DOCX đề Listening");
        return;
      }
      if (!listeningDocxFile.name.toLowerCase().endsWith(".docx")) {
        toast.error("File đề Listening phải có định dạng .docx");
        return;
      }
      if (!listeningAudioFile) {
        toast.error("Vui lòng chọn file audio cho đề Listening");
        return;
      }
      if (!isValidListeningAudio(listeningAudioFile)) {
        toast.error("Audio phải là MP3, WAV, M4A, WebM hoặc OGG");
        return;
      }
      if (listeningAudioFile.size > MAX_LISTENING_AUDIO_SIZE) {
        toast.error("File audio không được vượt quá 50MB");
        return;
      }

      setIsImportingListening(true);
      try {
        const result = await adminService.uploadAudioAndImportListeningDocx(
          listeningDocxFile,
          listeningAudioFile,
          examForm.status === "active"
        );
        const fetched = await adminService.getExams();
        setExams(fetched);
        const warningCount = result.warnings?.length ?? 0;
        if (warningCount > 0) {
          toast.success(`Import Listening thành công với ${warningCount} cảnh báo`);
        } else {
          toast.success("Import Listening thành công");
        }
        resetListeningImportFiles();
        setExamDialog(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra khi import Listening");
      } finally {
        setIsImportingListening(false);
      }
      return;
    }

    if (!examForm.title) { toast.error("Vui lòng nhập tên đề thi"); return; }
    if (editExam) {
      try {
        const updated = await adminService.updateExam(editExam.id, examForm);
        setExams(p => p.map(e => e.id === editExam.id ? updated : e));
        toast.success("Cập nhật thành công");
      } catch (err) {
        toast.error("Có lỗi xảy ra");
      }
    } else {
      try {
        const created = await adminService.createExam(examForm);
        setExams(p => [...p, created]);
        toast.success("Thêm thành công");
      } catch (err) {
        toast.error("Có lỗi xảy ra");
      }
    }
    setExamDialog(false);
  };

  const deleteExam = async (id: string) => {
    try {
      await adminService.deleteExam(id);
      setExams(p => p.filter(e => e.id !== id));
      toast.success("Xóa thành công");
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
  };

  // Price
  const openEditPrice = (p: PricePlan) => { setEditPlan(p); setPriceForm({ name: p.name, price: p.price, period: p.period, features: p.features.join("\n") }); setPriceDialog(true); };
  
  const savePrice = async () => {
    if (!editPlan) return;
    try {
      const updated = await adminService.updatePricePlan(editPlan.id, {
        name: priceForm.name,
        price: priceForm.price,
        period: priceForm.period,
        features: priceForm.features.split("\n").filter(Boolean)
      });
      setPlans(p => p.map(pl => pl.id === editPlan.id ? updated : pl));
      toast.success("Cập nhật giá thành công");
      setPriceDialog(false);
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = filterUserRole === "all" || u.role === filterUserRole;
    const matchesPlan = filterUserPlan === "all" || u.plan === filterUserPlan;
    const matchesStatus = filterUserStatus === "all" || u.status === filterUserStatus;
    return matchesSearch && matchesRole && matchesPlan && matchesStatus;
  });

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchExam.toLowerCase()) || e.skill.toLowerCase().includes(searchExam.toLowerCase());
    const matchesSkill = filterExamSkill === "all" || e.skill === filterExamSkill;
    const matchesDifficulty = filterExamDifficulty === "all" || e.difficulty === filterExamDifficulty;
    const matchesStatus = filterExamStatus === "all" || e.status === filterExamStatus;
    return matchesSearch && matchesSkill && matchesDifficulty && matchesStatus;
  });

  const getFilteredSamples = () => {
    if (!writingSamples) return [];
    const t1 = writingSamples.task1Samples.map(s => ({ ...s, taskType: "task1" as const, taskTitle: "Task 1 (Email/Letter)" }));
    const t2 = writingSamples.task2Samples.map(s => ({ ...s, taskType: "task2" as const, taskTitle: "Task 2 (Essay)" }));
    const combined = [...t1, ...t2];
    
    return combined.filter(s => {
      const matchesSearch = s.content.toLowerCase().includes(searchSample.toLowerCase()) || s.score.toLowerCase().includes(searchSample.toLowerCase());
      const matchesTask = filterSampleTask === "all" || s.taskType === filterSampleTask;
      const matchesLevel = filterSampleLevel === "all" || s.level === filterSampleLevel;
      return matchesSearch && matchesTask && matchesLevel;
    });
  };

  const totalStudents = users.filter(u => u.role === "student").length;
  const activeStudents = users.filter(u => u.role === "student" && u.status === "active").length;
  const totalExams = exams.length;
  const activeExams = exams.filter(e => e.status === "active").length;

  const usageData = stats?.usageData || [];
  const planDistData = stats?.planDistData || [];
  const subscriptionPurchaseData = stats?.subscriptionPurchaseData || [];
  const weeklyData = stats?.weeklyData || [];
  const recentActivities = stats?.recentActivities || [];
  const totalRevenue = stats?.totalRevenue || 0;
  const monthlyGrowth = stats?.monthlyGrowth || 0;

  const skillDistribution = ["Listening", "Reading", "Writing", "Speaking"].map(s => ({
    skill: s, count: exams.filter(e => e.skill === s).length,
    Icon: skillIcons[s], color: skillColors[s],
  }));

  const maxWeekly = weeklyData.length > 0 ? Math.max(...weeklyData) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải dữ liệu quản trị...</p>
        </div>
      </div>
    );
  }

  // Skill-specific form fields renderer
  const renderSkillForm = () => {
    const skill = examForm.skill;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          {(() => { const Icon = skillIcons[skill]; return Icon ? <Icon size={20} className={skillColors[skill]?.split(" ")[1]} /> : null; })()}
          <div>
            <p className="text-sm font-semibold text-foreground">{skill}</p>
            <p className="text-xs text-muted-foreground">
              {skill === "Listening" && "Cấu hình đề thi nghe với file audio"}
              {skill === "Reading" && "Cấu hình đề thi đọc hiểu với bài đọc"}
              {skill === "Writing" && "Cấu hình đề thi viết với topic và rubric"}
              {skill === "Speaking" && "Cấu hình đề thi nói với câu hỏi và thời gian"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Tên đề thi</Label>
          <Input value={examForm.title} onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))} placeholder={`Đề thi ${skill} #...`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Độ khó</Label>
            <Select value={examForm.difficulty} onValueChange={v => setExamForm(p => ({ ...p, difficulty: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Dễ">Dễ</SelectItem>
                <SelectItem value="Trung bình">Trung bình</SelectItem>
                <SelectItem value="Khó">Khó</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Trạng thái</Label>
            <Select value={examForm.status} onValueChange={v => setExamForm(p => ({ ...p, status: v as "active" | "draft" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Skill-specific fields */}
        {skill === "Listening" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Số câu hỏi</Label>
              <Input type="number" value={examForm.questions} onChange={e => setExamForm(p => ({ ...p, questions: Number(e.target.value) }))} />
            </div>
            {!editExam && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">File đề Listening (.docx)</Label>
                  <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                    <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs font-medium text-foreground break-all">
                      {listeningDocxFile ? listeningDocxFile.name : "Chọn file DOCX đề Listening"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Hỗ trợ .docx</p>
                    <Input
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      disabled={isImportingListening}
                      onChange={e => setListeningDocxFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">File Audio</Label>
                  <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                    <FileAudio size={28} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs font-medium text-foreground break-all">
                      {listeningAudioFile ? listeningAudioFile.name : "Chọn file MP3/WAV/M4A/WebM/OGG"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Hỗ trợ MP3, WAV, M4A, WebM, OGG (tối đa 50MB)</p>
                    <Input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.webm,.ogg,.m4a"
                      className="hidden"
                      disabled={isImportingListening}
                      onChange={e => setListeningAudioFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Thời gian nghe (phút)</Label>
              <Input type="number" placeholder="45" />
            </div>
          </>
        )}

        {skill === "Reading" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Số câu hỏi</Label>
              <Input type="number" value={examForm.questions} onChange={e => setExamForm(p => ({ ...p, questions: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nội dung bài đọc</Label>
              <Textarea placeholder="Dán nội dung bài đọc vào đây..." rows={5} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Thời gian đọc (phút)</Label>
              <Input type="number" placeholder="60" />
            </div>
          </>
        )}

        {skill === "Writing" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Số task</Label>
              <Input type="number" value={examForm.questions} onChange={e => setExamForm(p => ({ ...p, questions: Number(e.target.value) }))} placeholder="2" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Task 1 — Đề bài</Label>
              <Textarea placeholder="Mô tả biểu đồ / bảng số liệu..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Task 1 — Hình minh họa</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Image size={24} className="mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Tải lên biểu đồ / hình ảnh</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Task 2 — Đề bài (Essay)</Label>
              <Textarea placeholder="Viết essay về chủ đề..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rubric chấm điểm</Label>
              <Textarea placeholder="Tiêu chí chấm điểm cho task writing..." rows={3} />
            </div>
          </>
        )}

        {skill === "Speaking" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Số phần thi</Label>
              <Input type="number" value={examForm.questions} onChange={e => setExamForm(p => ({ ...p, questions: Number(e.target.value) }))} placeholder="3" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Part 1 — Social Interaction</Label>
              <Textarea placeholder="Câu hỏi giao tiếp xã hội..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Part 2 — Solution Discussion</Label>
              <Textarea placeholder="Mô tả tình huống thảo luận..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Part 3 — Topic Development</Label>
              <Textarea placeholder="Chủ đề phát triển ý..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Thời gian chuẩn bị (giây/câu)</Label>
              <Input type="number" placeholder="30" />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <Sidebar collapsible="icon" className="border-r border-border">
          <SidebarContent className="flex flex-col h-full">
            <div className="p-4 py-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <Link to="/" className="flex items-center gap-2.5">
                <img src={logoImg} alt="VSTEPPro" className="w-9 h-9 rounded-xl object-contain shrink-0 group-data-[collapsible=icon]:mx-auto" />
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-bold text-foreground text-sm leading-tight">VSTEPPro</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">Admin Panel</span>
                </div>
              </Link>
            </div>

            <Separator className="mx-4 w-auto group-data-[collapsible=icon]:hidden" />

            <SidebarGroup className="flex-1 pt-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.value}>
                       <SidebarMenuButton
                        onClick={() => setActiveTab(item.value)}
                        className={`cursor-pointer h-10 rounded-lg transition-all duration-200 flex items-center justify-center md:justify-start ${
                          activeTab === item.value
                            ? "bg-primary/10 text-primary font-semibold shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="md:block hidden group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="p-3 border-t border-border group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-none">
              <div className="flex flex-col md:flex-row items-center gap-2.5 px-1 md:px-2 w-full group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-9 w-9 md:h-8 md:w-8 shrink-0 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!h-9">
                  {user?.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{user?.name?.charAt(0) || "AD"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 hidden md:block text-center md:text-left group-data-[collapsible=icon]:!hidden">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name || "Admin"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email || "admin@vsteppro.vn"}</p>
                </div>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card/80 backdrop-blur-sm sticky top-0 z-30 gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-foreground">
                {sidebarItems.find(i => i.value === activeTab)?.title}
              </h1>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 hidden sm:flex">
                {activeTab === "dashboard" ? "Realtime" : activeTab === "users" ? `${users.length} users` : activeTab === "exams" ? `${exams.length} đề` : `${plans.length} gói`}
              </Badge>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              </Button>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-1.5 text-muted-foreground">
                <Link to="/"><LogOut size={14} /> Trang chủ</Link>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            {/* === DASHBOARD === */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Xin chào, Admin 👋</h2>
                    <p className="text-sm text-muted-foreground">Tổng quan hoạt động hệ thống hôm nay</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays size={14} />
                    <span>{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>

                {/* Stats cards with stagger animation */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Tổng học viên", value: totalStudents, sub: `${activeStudents} đang hoạt động`, icon: Users, trend: "+12%", up: true, accent: "bg-blue-500" },
                    { label: "Đề thi", value: totalExams, sub: `${activeExams} đang active`, icon: FileText, trend: "+3", up: true, accent: "bg-emerald-500" },
                    { label: "Doanh thu tháng", value: `${(totalRevenue / 1e6).toFixed(1)}M`, sub: "VND", icon: DollarSign, trend: `+${monthlyGrowth}%`, up: true, accent: "bg-amber-500" },
                    { label: "Lượt thi hôm nay", value: 28, sub: "↑ so với hôm qua", icon: Activity, trend: "+5", up: true, accent: "bg-purple-500" },
                  ].map((stat, i) => (
                    <Card key={stat.label} className="border-border overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                      <CardContent className="p-4 relative">
                        <div className={`absolute top-0 left-0 w-1 h-full ${stat.accent} rounded-r`} />
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-9 h-9 rounded-lg ${stat.accent}/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <stat.icon size={18} className={`${stat.accent.replace("bg-", "text-")}`} />
                          </div>
                          <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${stat.up ? "text-emerald-600" : "text-destructive"}`}>
                            {stat.up ? <ChevronUp size={12} /> : <ChevronDown size={12} />}{stat.trend}
                          </span>
                        </div>
                        <p className="text-2xl font-extrabold text-foreground leading-none">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1.5">{stat.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Usage chart - NEW */}
                <div className="grid lg:grid-cols-3 gap-4">
                  <Card className="border-border lg:col-span-2 hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-2 px-5 pt-5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <TrendingUp size={16} className="text-primary" /> Biểu đồ sử dụng web
                        </CardTitle>
                        <Badge variant="secondary" className="text-[10px]">7 ngày qua</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={usageData}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                              }}
                            />
                            <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#colorUsers)" strokeWidth={2} name="Người dùng" />
                            <Area type="monotone" dataKey="exams" stroke="hsl(142, 71%, 45%)" fill="url(#colorExams)" strokeWidth={2} name="Lượt thi" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plan distribution pie */}
                  <Card className="border-border hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-2 px-5 pt-5">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CreditCard size={16} className="text-primary" /> Phân bố gói
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 flex flex-col items-center">
                      <div className="h-36 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={planDistData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                              {planDistData.map((entry, index) => (
                                <Cell key={index} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                </div>

                {/* Subscription purchase chart */}
                <Card className="border-border hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-2 px-5 pt-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <DollarSign size={16} className="text-primary" /> Thống kê mua gói theo tháng
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px]">6 tháng gần nhất</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subscriptionPurchaseData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="free" name="Miễn phí" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="weekly" name="Gói Tuần" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="monthly" name="Gói Tháng" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 justify-center">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /> Miễn phí
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(210, 80%, 55%)" }} /> Gói Tuần
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Gói Tháng
                      </div>
                    </div>
                  </CardContent>
                </Card>
                      <div className="flex flex-wrap gap-3 mt-2 justify-center">
                        {planDistData.map(p => (
                          <div key={p.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
                            {p.name}: {p.value}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts row */}
                <div className="grid lg:grid-cols-3 gap-4">
                  <Card className="border-border lg:col-span-2 hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-2 px-5 pt-5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <BarChart3 size={16} className="text-primary" /> Lượt thi 7 ngày qua
                        </CardTitle>
                        <Badge variant="secondary" className="text-[10px]">Tuần này</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="flex items-end gap-2 h-32 mt-2">
                        {weeklyData.map((val, i) => {
                          const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
                          const isToday = i === weeklyData.length - 1;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                              <span className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                              <div
                                className={`w-full rounded-md transition-all duration-500 hover:scale-105 ${isToday ? "gradient-primary shadow-md" : "bg-primary/15 hover:bg-primary/30"}`}
                                style={{ height: `${(val / maxWeekly) * 100}%`, minHeight: 8, animationDelay: `${i * 80}ms` }}
                              />
                              <span className={`text-[10px] ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{days[i]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-2 px-5 pt-5">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <BookOpen size={16} className="text-primary" /> Phân bố kỹ năng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="space-y-3 mt-2">
                        {skillDistribution.map(s => {
                          const pct = totalExams > 0 ? Math.round((s.count / totalExams) * 100) : 0;
                          return (
                            <div key={s.skill} className="space-y-1.5 group">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform`}>
                                    <s.Icon size={13} />
                                  </div>
                                  <span className="text-xs font-medium text-foreground">{s.skill}</span>
                                </div>
                                <span className="text-xs font-bold text-foreground">{s.count} <span className="font-normal text-muted-foreground">({pct}%)</span></span>
                              </div>
                              <Progress value={pct} className="h-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent activity + Top students */}
                <div className="grid lg:grid-cols-2 gap-4">
                  <Card className="border-border hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-2 px-5 pt-5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Activity size={16} className="text-primary" /> Hoạt động gần đây
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">Xem tất cả</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="space-y-1">
                        {recentActivities.map((act, i) => (
                          <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition-all duration-200 hover:translate-x-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              act.type === "payment" ? "bg-emerald-500/10" : act.type === "exam" ? "bg-primary/10" : act.type === "add" ? "bg-amber-500/10" : "bg-purple-500/10"
                            }`}>
                              {act.type === "payment" ? <DollarSign size={13} className="text-emerald-600" /> :
                               act.type === "exam" ? <FileText size={13} className="text-primary" /> :
                               act.type === "add" ? <Plus size={13} className="text-amber-600" /> :
                               <Users size={13} className="text-purple-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground leading-relaxed">{act.text}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="pb-2 px-5 pt-5">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <GraduationCap size={16} className="text-primary" /> Top học viên
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="space-y-2">
                        {users.filter(u => u.role === "student").sort((a, b) => b.examsCompleted - a.examsCompleted).slice(0, 5).map((u, i) => (
                          <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-all duration-200 cursor-pointer hover:translate-x-1" onClick={() => setViewUser(u)}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              i === 0 ? "bg-amber-500/15 text-amber-600" : i === 1 ? "bg-gray-300/30 text-gray-600" : i === 2 ? "bg-orange-500/15 text-orange-600" : "bg-muted text-muted-foreground"
                            }`}>{i + 1}</span>
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{u.name.split(" ").pop()?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground">{u.plan}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{u.examsCompleted} bài</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* === USERS === */}
            {activeTab === "users" && (
              <div className="space-y-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Quản lí tài khoản</h2>
                    <p className="text-xs text-muted-foreground">{users.length} tài khoản • {activeStudents} đang hoạt động</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm theo tên, email..." className="pl-8 h-9 text-sm" value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                    </div>
                    <Select value={filterUserRole} onValueChange={setFilterUserRole}>
                      <SelectTrigger className="h-9 w-[110px] text-xs">
                        <SelectValue placeholder="Vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả vai trò</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="student">Học viên</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterUserPlan} onValueChange={setFilterUserPlan}>
                      <SelectTrigger className="h-9 w-[110px] text-xs">
                        <SelectValue placeholder="Gói" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả gói</SelectItem>
                        {plans.map(p => (
                          <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterUserStatus} onValueChange={setFilterUserStatus}>
                      <SelectTrigger className="h-9 w-[110px] text-xs">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="inactive">Ngưng</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={openAddUser} size="sm" className="gradient-primary text-primary-foreground gap-1.5 shrink-0">
                      <Plus size={14} /> Thêm
                    </Button>
                  </div>
                </div>
                <Card className="border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs font-semibold">Người dùng</TableHead>
                          <TableHead className="text-xs font-semibold">Gói</TableHead>
                          <TableHead className="text-xs font-semibold">Vai trò</TableHead>
                          <TableHead className="text-xs font-semibold">Trạng thái</TableHead>
                          <TableHead className="text-xs font-semibold">Hoạt động</TableHead>
                          <TableHead className="text-xs font-semibold">Bài thi</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(u => (
                          <TableRow key={u.id} className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setViewUser(u)}>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{u.name.split(" ").pop()?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {u.plan}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                                {u.role === "admin" ? "Admin" : "Học viên"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
                                <span className="text-xs text-muted-foreground">{u.status === "active" ? "Hoạt động" : "Ngưng"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{u.lastActive}</TableCell>
                            <TableCell className="text-xs font-medium text-foreground">{u.examsCompleted}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-0.5">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewUser(u)}><Eye size={13} /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditUser(u)}><Edit2 size={13} /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteUser(u.id)}><Trash2 size={13} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Không tìm thấy kết quả</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}

            {/* === EXAMS === */}
            {activeTab === "exams" && (
              <div className="space-y-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Quản lí đề thi</h2>
                    <p className="text-xs text-muted-foreground">{exams.length} đề thi • {activeExams} đang active</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm đề thi, kỹ năng..." className="pl-8 h-9 text-sm" value={searchExam} onChange={e => setSearchExam(e.target.value)} />
                    </div>
                    <Select value={filterExamSkill} onValueChange={setFilterExamSkill}>
                      <SelectTrigger className="h-9 w-[110px] text-xs">
                        <SelectValue placeholder="Kỹ năng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả kỹ năng</SelectItem>
                        <SelectItem value="Listening">Listening</SelectItem>
                        <SelectItem value="Reading">Reading</SelectItem>
                        <SelectItem value="Writing">Writing</SelectItem>
                        <SelectItem value="Speaking">Speaking</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterExamDifficulty} onValueChange={setFilterExamDifficulty}>
                      <SelectTrigger className="h-9 w-[110px] text-xs">
                        <SelectValue placeholder="Độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả độ khó</SelectItem>
                        <SelectItem value="Dễ">Dễ</SelectItem>
                        <SelectItem value="Trung bình">Trung bình</SelectItem>
                        <SelectItem value="Khó">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterExamStatus} onValueChange={setFilterExamStatus}>
                      <SelectTrigger className="h-9 w-[110px] text-xs">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={openAddExam} size="sm" className="gradient-primary text-primary-foreground gap-1.5 shrink-0">
                      <Plus size={14} /> Thêm đề
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skillDistribution.map(s => (
                    <div key={s.skill} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${s.color} border border-transparent hover:scale-105 transition-transform cursor-default`}>
                      <s.Icon size={13} />
                      <span>{s.skill}: {s.count}</span>
                    </div>
                  ))}
                </div>

                <Card className="border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs font-semibold">Tên đề</TableHead>
                          <TableHead className="text-xs font-semibold">Kỹ năng</TableHead>
                          <TableHead className="text-xs font-semibold">Độ khó</TableHead>
                          <TableHead className="text-xs font-semibold">Số câu</TableHead>
                          <TableHead className="text-xs font-semibold">Trạng thái</TableHead>
                          <TableHead className="text-xs font-semibold"><Clock size={12} className="inline mr-1" />Upload</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExams.map(e => {
                          const SkillIcon = skillIcons[e.skill] || FileText;
                          const color = skillColors[e.skill] || "";
                          return (
                            <TableRow key={e.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="font-medium text-sm">{e.title}</TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${color}`}>
                                  <SkillIcon size={12} /> {e.skill}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  e.difficulty === "Dễ" ? "bg-emerald-500/10 text-emerald-600" :
                                  e.difficulty === "Trung bình" ? "bg-amber-500/10 text-amber-600" :
                                  "bg-red-500/10 text-red-600"
                                }`}>{e.difficulty}</span>
                              </TableCell>
                              <TableCell className="text-sm">{e.questions}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${e.status === "active" ? "bg-emerald-500" : "bg-amber-400"}`} />
                                  <span className="text-xs">{e.status === "active" ? "Active" : "Draft"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{e.uploadedAt}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditExam(e)}><Edit2 size={13} /></Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteExam(e.id)}><Trash2 size={13} /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredExams.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Không tìm thấy kết quả</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}

            {/* === PRICING === */}
            {activeTab === "pricing" && (
              <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Quản lí gói giá</h2>
                  <p className="text-xs text-muted-foreground">Cấu hình giá và tính năng các gói học tập</p>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                  {plans.map((p, idx) => (
                    <Card key={p.id} className={`border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${idx === 1 ? "ring-2 ring-primary/30" : ""}`}>
                      {idx === 1 && (
                        <div className="gradient-primary text-primary-foreground text-center text-[10px] font-bold py-1 tracking-wide uppercase">
                          Phổ biến nhất
                        </div>
                      )}
                      <CardContent className="p-5 space-y-4">
                        <div className="text-center space-y-2">
                          <Badge variant="secondary" className="text-[10px]">{p.period === "Mãi mãi" ? "Free" : p.period}</Badge>
                          <h3 className="font-bold text-foreground">{p.name}</h3>
                          <p className="text-3xl font-extrabold text-foreground">
                            {p.price === 0 ? "0" : p.price.toLocaleString("vi-VN")}
                            <span className="text-sm font-normal text-muted-foreground">đ</span>
                          </p>
                        </div>
                        <Separator />
                        <ul className="space-y-2 flex flex-col items-center text-center">
                          {p.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground text-center">
                              <span className="text-primary">✓</span> {f}
                            </li>
                          ))}
                        </ul>
                        <Button variant="outline" className="w-full gap-1.5 text-xs" onClick={() => openEditPrice(p)}>
                          <Edit2 size={12} /> Chỉnh sửa
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* === SAMPLE ANSWERS === */}
            {activeTab === "sample-answers" && (
              <div className="space-y-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Quản lí bài viết mẫu</h2>
                    <p className="text-xs text-muted-foreground">
                      {writingSamples ? getFilteredSamples().length : 0} bài viết mẫu đang hiển thị cho học viên
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm theo nội dung, điểm số..." className="pl-8 h-9 text-sm" value={searchSample} onChange={e => setSearchSample(e.target.value)} />
                    </div>
                    <Select value={filterSampleTask} onValueChange={setFilterSampleTask}>
                      <SelectTrigger className="h-9 w-[140px] text-xs">
                        <SelectValue placeholder="Phân loại Task" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả các Task</SelectItem>
                        <SelectItem value="task1">Task 1 (Thư/Email)</SelectItem>
                        <SelectItem value="task2">Task 2 (Essay)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterSampleLevel} onValueChange={setFilterSampleLevel}>
                      <SelectTrigger className="h-9 w-[110px] text-xs">
                        <SelectValue placeholder="Trình độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trình độ</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={openAddSample} size="sm" className="gradient-primary text-primary-foreground gap-1.5 shrink-0">
                      <Plus size={14} /> Thêm bài mẫu
                    </Button>
                  </div>
                </div>

                <Card className="border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs font-semibold w-[150px]">Loại bài</TableHead>
                          <TableHead className="text-xs font-semibold w-[90px]">Trình độ</TableHead>
                          <TableHead className="text-xs font-semibold w-[90px]">Điểm số</TableHead>
                          <TableHead className="text-xs font-semibold">Nội dung bài viết mẫu</TableHead>
                          <TableHead className="text-xs font-semibold w-[180px]">Số lý do chấm điểm</TableHead>
                          <TableHead className="text-xs font-semibold text-right w-[110px]">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredSamples().map(s => (
                          <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-semibold text-xs text-foreground shrink-0">{s.taskTitle}</TableCell>
                            <TableCell>
                              <Badge className={s.level === "B2" ? "gradient-primary text-primary-foreground text-[10px]" : "bg-secondary text-secondary-foreground text-[10px]"}>
                                {s.level}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star size={12} className="text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold">{s.score}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs text-muted-foreground truncate max-w-[320px]">{s.content}</p>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-foreground">{s.reasons.length} lý do</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditSample(s, s.taskType)}><Edit2 size={13} /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteSample(s.id)}><Trash2 size={13} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {getFilteredSamples().length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                              Không tìm thấy bài viết mẫu nào
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thông tin chi tiết người dùng</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{viewUser.name.split(" ").pop()?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg">{viewUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={viewUser.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                      {viewUser.role === "admin" ? "Admin" : "Học viên"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${viewUser.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
                      <span className="text-[11px] text-muted-foreground">{viewUser.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan info */}
              <div className="p-4 rounded-xl border border-border space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Crown size={14} className="text-amber-500" /> Gói đang sử dụng
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-foreground">{viewUser.plan}</p>
                    <p className="text-xs text-muted-foreground">Đăng ký từ {viewUser.createdAt}</p>
                  </div>
                  <Badge className="gradient-primary text-primary-foreground">{viewUser.plan === "Miễn phí" ? "Free" : "Premium"}</Badge>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-blue-600" />
                    <span className="text-xs text-muted-foreground">Bài thi</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{viewUser.examsCompleted}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={14} className="text-amber-600" />
                    <span className="text-xs text-muted-foreground">Streak</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{viewUser.streak} ngày</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={14} className="text-purple-600" />
                    <span className="text-xs text-muted-foreground">Điểm thưởng</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{viewUser.points}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Hoạt động</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{viewUser.lastActive}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>Đóng</Button>
            <Button onClick={() => { if (viewUser) { openEditUser(viewUser); setViewUser(null); } }} className="gradient-primary text-primary-foreground gap-1.5">
              <Edit2 size={14} /> Chỉnh sửa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Họ tên</Label><Input value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Vai trò</Label>
                <Select value={userForm.role} onValueChange={v => setUserForm(p => ({ ...p, role: v as "admin" | "student" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Học viên</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Trạng thái</Label>
                <Select value={userForm.status} onValueChange={v => setUserForm(p => ({ ...p, status: v as "active" | "inactive" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Hoạt động</SelectItem><SelectItem value="inactive">Ngưng</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gói sử dụng</Label>
              <Select value={userForm.plan} onValueChange={v => setUserForm(p => ({ ...p, plan: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Miễn phí">Miễn phí (Free)</SelectItem>
                  <SelectItem value="Gói Tuần">Gói Tuần (Premium)</SelectItem>
                  <SelectItem value="Gói Tháng">Gói Tháng (Premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)}>Hủy</Button>
            <Button onClick={saveUser} className="gradient-primary text-primary-foreground gap-1.5"><Save size={14} /> Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exam Dialog — Step-based */}
      <Dialog open={examDialog} onOpenChange={setExamDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editExam ? "Chỉnh sửa đề thi" : examStep === "skill" ? "Chọn kỹ năng" : `Thêm đề ${examForm.skill}`}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1 -mr-2">
            {/* Step 1: Choose skill */}
            {!editExam && examStep === "skill" && (
              <div className="grid grid-cols-2 gap-3 py-2">
                {(["Listening", "Reading", "Writing", "Speaking"] as const).map(skill => {
                  const Icon = skillIcons[skill];
                  const color = skillColors[skill];
                  return (
                    <button
                      key={skill}
                      onClick={() => selectSkillForExam(skill)}
                      className={`p-5 rounded-xl border-2 border-border hover:border-primary/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col items-center gap-3 group`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{skill}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {skill === "Listening" && "Nghe hiểu"}
                        {skill === "Reading" && "Đọc hiểu"}
                        {skill === "Writing" && "Viết luận"}
                        {skill === "Speaking" && "Nói"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Skill-specific form */}
            {(editExam || examStep === "form") && (
              <>
                {!editExam && (
                  <Button variant="ghost" size="sm" className="w-fit gap-1 text-xs text-muted-foreground -mt-2" onClick={() => setExamStep("skill")}>
                    <ArrowLeft size={14} /> Chọn kỹ năng khác
                  </Button>
                )}
                {renderSkillForm()}
                <DialogFooter className="pt-4">
                  <Button variant="outline" onClick={() => setExamDialog(false)}>Hủy</Button>
                  <Button onClick={saveExam} disabled={isImportingListening} className="gradient-primary text-primary-foreground gap-1.5">
                    <Save size={14} /> {isImportingListening ? "Đang import..." : "Lưu"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Dialog */}
      <Dialog open={priceDialog} onOpenChange={setPriceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chỉnh sửa gói giá</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Tên gói</Label><Input value={priceForm.name} onChange={e => setPriceForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Giá (VND)</Label><Input type="number" value={priceForm.price} onChange={e => setPriceForm(p => ({ ...p, price: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Chu kỳ</Label><Input value={priceForm.period} onChange={e => setPriceForm(p => ({ ...p, period: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Tính năng (mỗi dòng 1 tính năng)</Label><Textarea value={priceForm.features} onChange={e => setPriceForm(p => ({ ...p, features: e.target.value }))} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialog(false)}>Hủy</Button>
            <Button onClick={savePrice} className="gradient-primary text-primary-foreground gap-1.5"><Save size={14} /> Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Writing Sample Dialog */}
      <Dialog open={sampleDialog} onOpenChange={setSampleDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editSample ? "Chỉnh sửa bài viết mẫu" : "Thêm bài viết mẫu mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-1 -mr-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Loại bài</Label>
                <Select value={sampleForm.taskType} onValueChange={v => setSampleForm(p => ({ ...p, taskType: v as "task1" | "task2" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task1">Task 1 (Email/Letter)</SelectItem>
                    <SelectItem value="task2">Task 2 (Essay)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Trình độ</Label>
                <Select value={sampleForm.level} onValueChange={v => setSampleForm(p => ({ ...p, level: v as "B1" | "B2" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Điểm số</Label>
                <Input value={sampleForm.score} onChange={e => setSampleForm(p => ({ ...p, score: e.target.value }))} placeholder="Ví dụ: 8.5/10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nội dung bài mẫu</Label>
              <Textarea value={sampleForm.content} onChange={e => setSampleForm(p => ({ ...p, content: e.target.value }))} placeholder="Nhập hoặc dán nội dung bài viết mẫu vào đây..." rows={8} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Các lý do đạt điểm (Rubric Reasons)</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addReasonField}>
                  <Plus size={12} /> Thêm lý do
                </Button>
              </div>
              <div className="space-y-2.5">
                {sampleForm.reasons.map((reason, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-muted/40 p-2.5 rounded-lg border border-border">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-semibold">Lý do #{idx + 1}</Label>
                      <Textarea value={reason} onChange={e => updateReasonField(idx, e.target.value)} placeholder="Nhập lý do phân tích tiêu chí đạt điểm (ví dụ: Task Achievement, Grammar...)" rows={2} className="text-xs animate-none" />
                    </div>
                    {sampleForm.reasons.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 mt-5" onClick={() => removeReasonField(idx)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2 border-t border-border mt-4">
            <Button variant="outline" onClick={() => setSampleDialog(false)}>Hủy</Button>
            <Button onClick={saveSample} className="gradient-primary text-primary-foreground gap-1.5"><Save size={14} /> Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Admin;
