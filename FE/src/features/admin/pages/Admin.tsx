import { Fragment, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, DollarSign, Plus, Trash2, Edit2, Search,
  Save, Clock, TrendingUp, BookOpen, Activity, ArrowUpRight, BarChart3,
  LogOut, Bell, ChevronUp, ChevronDown, Eye, MoreHorizontal, CalendarDays,
  GraduationCap, Headphones, BookOpenCheck, Mic, PenTool, X, Upload,
  FileAudio, Image, ArrowLeft, Flame, Star, Crown, CreditCard, Shield,
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
type AdminSkill = "Listening" | "Reading" | "Writing" | "Speaking";

const ADMIN_SKILLS: AdminSkill[] = ["Listening", "Reading", "Writing", "Speaking"];
const isAdminSkill = (value: string): value is AdminSkill => ADMIN_SKILLS.includes(value as AdminSkill);

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
  { title: "Tổng quan", value: "dashboard" as Tab, icon: LayoutDashboard, color: "text-blue-500" },
  { title: "Tài khoản", value: "users" as Tab, icon: Users, color: "text-purple-500" },
  { title: "Đề thi", value: "exams" as Tab, icon: FileText, color: "text-emerald-500" },
  { title: "Bài viết mẫu", value: "sample-answers" as Tab, icon: BookOpen, color: "text-amber-500" },
  { title: "Quản lí giá", value: "pricing" as Tab, icon: DollarSign, color: "text-rose-500" },
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

const getFileExtension = (file: File) => file.name.split(".").pop()?.toLowerCase() ?? "";

const isValidListeningAudio = (file: File) => {
  const extension = getFileExtension(file);
  return LISTENING_AUDIO_TYPES.has(file.type) || LISTENING_AUDIO_EXTENSIONS.has(extension);
};

const Admin = () => {
  const { user, isInitialising, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [plans, setPlans] = useState<PricePlan[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [writingSamples, setWritingSamples] = useState<{ task1Samples: SampleEssay[]; task2Samples: SampleEssay[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitialising) return;

    if (!isLoggedIn || user?.role !== "admin") {
      toast.error("Vui lòng đăng nhập tài khoản Admin.");
      navigate("/auth");
      return;
    }

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
    }).catch((err) => {
      console.error(err);
      if (isMounted) {
        toast.error("Không thể tải dữ liệu quản trị. Vui lòng thử lại.");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isInitialising, isLoggedIn, user, navigate]);

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

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Đăng ký gói mới 💎",
      message: "Học viên Nguyễn Văn A vừa nâng cấp thành công lên Gói Tháng.",
      time: "5 phút trước",
      read: false,
    },
    {
      id: "2",
      title: "Đề thi mới cần duyệt 📝",
      message: "Giáo viên vừa tải lên bản nháp 'Đề thi Writing #2'.",
      time: "25 phút trước",
      read: false,
    },
    {
      id: "3",
      title: "Hoàn thành bài thi 🏆",
      message: "Học viên Trần Thị B đã hoàn thành bài thi thử 'Đề thi Listening #1' với số điểm 28/35.",
      time: "1 giờ trước",
      read: true,
    },
    {
      id: "4",
      title: "Hệ thống bảo trì ⚙️",
      message: "Lịch bảo trì định kỳ hệ thống cơ sở dữ liệu dự kiến diễn ra lúc 02:00 ngày mai.",
      time: "1 ngày trước",
      read: true,
    },
  ]);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const [userDialog, setUserDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "student" as "admin" | "student", status: "active" as "active" | "inactive", plan: "Miễn phí" });

  // User detail view
  const [viewUser, setViewUser] = useState<User | null>(null);

  // Exam creation: step-based
  const [examDialog, setExamDialog] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [examStep, setExamStep] = useState<"mode" | "skill" | "form" | "mt_info" | "mt_listening" | "mt_reading" | "mt_writing" | "mt_speaking" | "mt_confirm">("mode");
  const [examMode, setExamMode] = useState<"practice" | "mock_test" | null>(null);
  const [examForm, setExamForm] = useState({
    title: "",
    skill: "Listening" as AdminSkill,
    difficulty: "Dễ",
    questions: 35,
    status: "draft" as "active" | "draft",
    mode: "practice" as "practice" | "mock_test",
    duration: 40,
    writingTask1: "",
    writingTask2: "",
    speakingPart1: "",
    speakingPart2: "",
    speakingPart3: "",
  });

  // Mock test wizard states
  const [mockTestForm, setMockTestForm] = useState<{
    title: string;
    difficulty: string;
    status: "active" | "draft";
    listening: {
      title: string;
      docxFile: File | null;
      audioFile: File | null;
    };
    reading: {
      title: string;
      docxFile: File | null;
    };
    writing: {
      title: string;
      writingTask1: string;
      writingTask2: string;
    };
    speaking: {
      title: string;
      speakingPart1: string;
      speakingPart2: string;
      speakingPart3: string;
    };
  }>({
    title: "",
    difficulty: "Trung bình",
    status: "draft",
    listening: { title: "", docxFile: null, audioFile: null },
    reading: { title: "", docxFile: null },
    writing: { title: "", writingTask1: "", writingTask2: "" },
    speaking: { title: "", speakingPart1: "", speakingPart2: "", speakingPart3: "" },
  });

  const [isUploadingMockTest, setIsUploadingMockTest] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const mtListeningDocxRef = useRef<HTMLInputElement | null>(null);
  const mtListeningAudioRef = useRef<HTMLInputElement | null>(null);
  const mtReadingDocxRef = useRef<HTMLInputElement | null>(null);

  const readingDocxInputRef = useRef<HTMLInputElement | null>(null);
  const [readingDocxFile, setReadingDocxFile] = useState<File | null>(null);
  const [importingReadingDocx, setImportingReadingDocx] = useState(false);
  const listeningAudioInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedAudioExam, setSelectedAudioExam] = useState<Exam | null>(null);
  const [uploadingAudioExamId, setUploadingAudioExamId] = useState<string | null>(null);
  const listeningDocxInputRef = useRef<HTMLInputElement | null>(null);
  const listeningImportAudioInputRef = useRef<HTMLInputElement | null>(null);
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
  const openAddExam = () => {
    setEditExam(null);
    setExamStep("mode");
    setExamMode(null);
    setExamForm({
      title: "",
      skill: "Listening",
      difficulty: "Dễ",
      questions: 35,
      status: "draft",
      mode: "practice",
      duration: 40,
      writingTask1: "",
      writingTask2: "",
      speakingPart1: "",
      speakingPart2: "",
      speakingPart3: "",
    });
    setListeningDocxFile(null);
    setListeningAudioFile(null);
    setReadingDocxFile(null);
    if (listeningDocxInputRef.current) listeningDocxInputRef.current.value = "";
    if (listeningImportAudioInputRef.current) listeningImportAudioInputRef.current.value = "";
    if (readingDocxInputRef.current) readingDocxInputRef.current.value = "";
    setExamDialog(true);
  };
  
  const openEditExam = (e: Exam) => {
    setEditExam(e);
    setExamStep("form");
    setExamMode(e.mode || "practice");
    setExamForm({
      title: e.title,
      skill: isAdminSkill(e.skill) ? e.skill : "Listening",
      difficulty: e.difficulty,
      questions: e.questions,
      status: e.status,
      mode: e.mode || "practice",
      duration: e.duration || (e.skill === "Listening" ? 40 : e.skill === "Reading" ? 60 : e.skill === "Writing" ? 60 : 15),
      writingTask1: e.writingTask1 || "",
      writingTask2: e.writingTask2 || "",
      speakingPart1: e.speakingPart1 || "",
      speakingPart2: e.speakingPart2 || "",
      speakingPart3: e.speakingPart3 || "",
    });
    setExamDialog(true);
  };
  
  const saveExam = async () => {
    if (!examForm.title) { toast.error("Vui lòng nhập tên đề thi"); return; }
    if (!editExam && examForm.skill === "Listening") {
      if (!listeningDocxFile) {
        toast.error("Vui lòng chọn file DOCX cho đề Listening");
        return;
      }
      if (!listeningDocxFile.name.toLowerCase().endsWith(".docx")) {
        toast.error("File đề Listening phải là .docx");
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
        const { warnings } = await adminService.uploadAudioAndImportListeningDocx(
          listeningDocxFile,
          listeningAudioFile,
          examForm.status === "active"
        );
        const fetchedExams = await adminService.getExams();
        setExams(fetchedExams);
        setListeningDocxFile(null);
        setListeningAudioFile(null);
        if (listeningDocxInputRef.current) listeningDocxInputRef.current.value = "";
        if (listeningImportAudioInputRef.current) listeningImportAudioInputRef.current.value = "";
        toast.success(warnings.length > 0
          ? `Import Listening thành công với ${warnings.length} cảnh báo`
          : "Import đề Listening thành công");
        setExamDialog(false);
      } catch (err) {
        const message = (err as { message?: string })?.message;
        toast.error(message || "Import đề Listening thất bại");
      } finally {
        setIsImportingListening(false);
      }
      return;
    }

    if (!editExam && examForm.skill === "Reading") {
      if (!readingDocxFile) {
        toast.error("Vui lòng chọn file DOCX cho đề Reading");
        return;
      }
      if (!readingDocxFile.name.toLowerCase().endsWith(".docx")) {
        toast.error("File đề Reading phải là .docx");
        return;
      }

      setImportingReadingDocx(true);
      try {
        let { exam: importedExam, warnings } = await adminService.importReadingDocx(
          readingDocxFile,
          examForm.status === "active"
        );

        importedExam = await adminService.updateExam(importedExam.id, {
          ...importedExam,
          title: examForm.title,
          difficulty: examForm.difficulty,
          questions: examForm.questions,
          mode: examForm.mode,
          status: examForm.status,
        });

        const fetchedExams = await adminService.getExams();
        setExams(fetchedExams);
        setReadingDocxFile(null);
        if (readingDocxInputRef.current) readingDocxInputRef.current.value = "";
        toast.success(warnings.length > 0
          ? `Import Reading thành công với ${warnings.length} cảnh báo`
          : "Import đề Reading thành công");
        setExamDialog(false);
      } catch (err) {
        const message = (err as { message?: string })?.message;
        toast.error(message || "Import đề Reading thất bại");
      } finally {
        setImportingReadingDocx(false);
      }
      return;
    }

    if (!editExam && examForm.skill === "Speaking") {
      if (!examForm.speakingPart1 || !examForm.speakingPart2 || !examForm.speakingPart3) {
        toast.error("Vui lòng điền đầy đủ đề Speaking Part 1, Part 2 và Part 3");
        return;
      }

      try {
        const baseTitle = examForm.title;
        const parts = [
          { title: `${baseTitle} - Speaking Part 1`, prompt: examForm.speakingPart1 },
          { title: `${baseTitle} - Speaking Part 2`, prompt: examForm.speakingPart2 },
          { title: `${baseTitle} - Speaking Part 3`, prompt: examForm.speakingPart3 },
        ];

        const created = await Promise.all(parts.map(part => adminService.createExam({
          title: part.title,
          skill: "Speaking",
          difficulty: examForm.difficulty,
          questions: 1,
          status: examForm.status,
          mode: examForm.mode,
          description: `${part.prompt} | mode:${examForm.mode}`,
        })));

        setExams(p => [...p, ...created]);
        toast.success("Thêm đề Speaking thành công");
      } catch (err) {
        toast.error("Có lỗi xảy ra");
      }

      setExamDialog(false);
      return;
    }

    if (!editExam && examForm.skill === "Writing") {
      if (!examForm.writingTask1 || !examForm.writingTask2) {
        toast.error("Vui lòng điền đầy đủ đề Writing Task 1 và Task 2");
        return;
      }

      try {
        const baseTitle = examForm.title;
        const tasks = [
          { title: `${baseTitle} - Writing Task 1`, prompt: examForm.writingTask1 },
          { title: `${baseTitle} - Writing Task 2`, prompt: examForm.writingTask2 },
        ];

        const created = await Promise.all(tasks.map(task => adminService.createExam({
          title: task.title,
          skill: "Writing",
          difficulty: examForm.difficulty,
          questions: 1,
          status: examForm.status,
          mode: examForm.mode,
          description: `${task.prompt} | mode:${examForm.mode}`,
        })));

        setExams(p => [...p, ...created]);
        toast.success("Thêm đề Writing thành công");
      } catch (err) {
        toast.error("Có lỗi xảy ra");
      }

      setExamDialog(false);
      return;
    }

    const examPayload = {
      title: examForm.title,
      skill: examForm.skill,
      difficulty: examForm.difficulty,
      questions: examForm.questions,
      status: examForm.status,
      mode: examForm.mode,
    };
    if (editExam) {
      try {
        const updated = await adminService.updateExam(editExam.id, examPayload);
        setExams(p => p.map(e => e.id === editExam.id ? updated : e));
        toast.success("Cập nhật thành công");
      } catch (err) {
        toast.error("Có lỗi xảy ra");
      }
    } else {
      try {
        const created = await adminService.createExam(examPayload);
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

  const deleteExamGroup = async (groupId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ 4 kỹ năng của đề thi thử này không?")) return;
    try {
      const groupExams = exams.filter(e => e.groupId === groupId);
      await Promise.all(groupExams.map(e => adminService.deleteExam(e.id)));
      setExams(p => p.filter(e => e.groupId !== groupId));
      toast.success("Xóa nhóm đề thi thử thành công");
    } catch (err) {
      toast.error("Có lỗi xảy ra khi xóa nhóm đề thi thử");
    }
  };

  const saveMockTest = async () => {
    if (!mockTestForm.title) {
      toast.error("Vui lòng nhập tên đề thi thử");
      return;
    }
    if (!mockTestForm.listening.docxFile) {
      toast.error("Vui lòng chọn file đề thi DOCX cho Listening");
      return;
    }
    if (!mockTestForm.listening.audioFile) {
      toast.error("Vui lòng chọn file Audio cho Listening");
      return;
    }
    if (!mockTestForm.listening.docxFile.name.toLowerCase().endsWith(".docx")) {
      toast.error("File đề Listening phải là .docx");
      return;
    }
    if (!isValidListeningAudio(mockTestForm.listening.audioFile)) {
      toast.error("Audio Listening phải là MP3, WAV, M4A, WebM hoặc OGG");
      return;
    }
    if (mockTestForm.listening.audioFile.size > MAX_LISTENING_AUDIO_SIZE) {
      toast.error("File audio Listening không được vượt quá 50MB");
      return;
    }
    if (!mockTestForm.reading.docxFile) {
      toast.error("Vui lòng chọn file đề thi DOCX cho Reading");
      return;
    }
    if (!mockTestForm.writing.writingTask1 || !mockTestForm.writing.writingTask2) {
      toast.error("Vui lòng điền đề bài viết cho cả Task 1 và Task 2");
      return;
    }
    if (!mockTestForm.speaking.speakingPart1 || !mockTestForm.speaking.speakingPart2 || !mockTestForm.speaking.speakingPart3) {
      toast.error("Vui lòng điền đầy đủ câu hỏi cho cả 3 phần thi Nói");
      return;
    }

    setIsUploadingMockTest(true);
    const groupId = `mock_test_${Date.now()}`;
    const groupTitle = mockTestForm.title;
    const isPublished = mockTestForm.status === "active";

    try {
      // 1. Upload Listening
      setUploadProgress("Đang tạo đề thi Listening...");
      const listeningTitle = mockTestForm.listening.title || `${groupTitle} - Listening`;
      const listeningDocx = mockTestForm.listening.docxFile;
      const listeningAudio = mockTestForm.listening.audioFile;

      let { exam: listeningExam } = await adminService.uploadAudioAndImportListeningDocx(
        listeningDocx,
        listeningAudio,
        isPublished
      );
      
      listeningExam = await adminService.updateExam(listeningExam.id, {
        ...listeningExam,
        title: listeningTitle,
        groupId,
        groupTitle,
        mode: "mock_test",
        status: mockTestForm.status,
      });
      // 2. Upload Reading
      setUploadProgress("Đang tạo đề thi Reading...");
      const readingTitle = mockTestForm.reading.title || `${groupTitle} - Reading`;
      const readingDocx = mockTestForm.reading.docxFile;
      
      let { exam: readingExam } = await adminService.importReadingDocx(readingDocx, isPublished);
      readingExam = await adminService.updateExam(readingExam.id, {
        ...readingExam,
        title: readingTitle,
        groupId,
        groupTitle,
        mode: "mock_test",
        status: mockTestForm.status,
      });

      // 3. Create Writing Task 1
      setUploadProgress("Đang tạo đề thi Writing Task 1...");
      const writing1Title = `${groupTitle} - Writing Task 1`;
      const writing1Exam = await adminService.createExam({
        title: writing1Title,
        skill: "Writing",
        difficulty: mockTestForm.difficulty,
        questions: 1,
        status: mockTestForm.status,
        mode: "mock_test",
        groupId,
        groupTitle,
      });
      await adminService.updateExam(writing1Exam.id, {
        ...writing1Exam,
        groupId,
        groupTitle,
        mode: "mock_test",
        status: mockTestForm.status,
        title: writing1Title,
        description: `${mockTestForm.writing.writingTask1} | mode:mock_test;group:${groupId};groupTitle:${groupTitle}`
      });

      // 4. Create Writing Task 2
      setUploadProgress("Đang tạo đề thi Writing Task 2...");
      const writing2Title = `${groupTitle} - Writing Task 2`;
      const writing2Exam = await adminService.createExam({
        title: writing2Title,
        skill: "Writing",
        difficulty: mockTestForm.difficulty,
        questions: 1,
        status: mockTestForm.status,
        mode: "mock_test",
        groupId,
        groupTitle,
      });
      await adminService.updateExam(writing2Exam.id, {
        ...writing2Exam,
        groupId,
        groupTitle,
        mode: "mock_test",
        status: mockTestForm.status,
        title: writing2Title,
        description: `${mockTestForm.writing.writingTask2} | mode:mock_test;group:${groupId};groupTitle:${groupTitle}`
      });

      // 5. Create Speaking Part 1
      setUploadProgress("Đang tạo đề thi Speaking Part 1...");
      const speaking1Title = `${groupTitle} - Speaking Part 1`;
      const speaking1Exam = await adminService.createExam({
        title: speaking1Title,
        skill: "Speaking",
        difficulty: mockTestForm.difficulty,
        questions: 1,
        status: mockTestForm.status,
        mode: "mock_test",
        groupId,
        groupTitle,
      });
      await adminService.updateExam(speaking1Exam.id, {
        ...speaking1Exam,
        groupId,
        groupTitle,
        mode: "mock_test",
        status: mockTestForm.status,
        title: speaking1Title,
        description: `${mockTestForm.speaking.speakingPart1} | mode:mock_test;group:${groupId};groupTitle:${groupTitle}`
      });

      // 6. Create Speaking Part 2
      setUploadProgress("Đang tạo đề thi Speaking Part 2...");
      const speaking2Title = `${groupTitle} - Speaking Part 2`;
      const speaking2Exam = await adminService.createExam({
        title: speaking2Title,
        skill: "Speaking",
        difficulty: mockTestForm.difficulty,
        questions: 1,
        status: mockTestForm.status,
        mode: "mock_test",
        groupId,
        groupTitle,
      });
      await adminService.updateExam(speaking2Exam.id, {
        ...speaking2Exam,
        groupId,
        groupTitle,
        mode: "mock_test",
        status: mockTestForm.status,
        title: speaking2Title,
        description: `${mockTestForm.speaking.speakingPart2} | mode:mock_test;group:${groupId};groupTitle:${groupTitle}`
      });

      // 7. Create Speaking Part 3
      setUploadProgress("Đang tạo đề thi Speaking Part 3...");
      const speaking3Title = `${groupTitle} - Speaking Part 3`;
      const speaking3Exam = await adminService.createExam({
        title: speaking3Title,
        skill: "Speaking",
        difficulty: mockTestForm.difficulty,
        questions: 1,
        status: mockTestForm.status,
        mode: "mock_test",
        groupId,
        groupTitle,
      });
      await adminService.updateExam(speaking3Exam.id, {
        ...speaking3Exam,
        groupId,
        groupTitle,
        mode: "mock_test",
        status: mockTestForm.status,
        title: speaking3Title,
        description: `${mockTestForm.speaking.speakingPart3} | mode:mock_test;group:${groupId};groupTitle:${groupTitle}`
      });

      const fetchedExams = await adminService.getExams();
      setExams(fetchedExams);

      toast.success("Đăng tải đề thi thử 4 kỹ năng thành công!");
      setExamDialog(false);
    } catch (err) {
      const message = (err as { message?: string })?.message;
      toast.error(message || "Có lỗi xảy ra khi upload đề thi thử");
    } finally {
      setIsUploadingMockTest(false);
      setUploadProgress("");
    }
  };

  const importReadingDocx = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Vui lòng chọn file .docx");
      return;
    }

    setImportingReadingDocx(true);
    try {
      const { exam, warnings } = await adminService.importReadingDocx(file, false);
      setExams(p => [...p, exam]);
      toast.success(warnings.length > 0
        ? `Import thành công với ${warnings.length} cảnh báo`
        : "Import đề Reading thành công");
    } catch (err) {
      const message = (err as { message?: string })?.message;
      toast.error(message || "Import file DOCX thất bại");
    } finally {
      setImportingReadingDocx(false);
      if (readingDocxInputRef.current) {
        readingDocxInputRef.current.value = "";
      }
    }
  };

  const openListeningAudioUpload = (exam: Exam) => {
    setSelectedAudioExam(exam);
    listeningAudioInputRef.current?.click();
  };

  const uploadListeningAudio = async (file: File | undefined) => {
    if (!file || !selectedAudioExam) return;
    if (!isValidListeningAudio(file)) {
      toast.error("Audio phải là MP3, WAV, M4A, WebM hoặc OGG");
      return;
    }
    if (file.size > MAX_LISTENING_AUDIO_SIZE) {
      toast.error("File audio không được vượt quá 50MB");
      return;
    }

    setUploadingAudioExamId(selectedAudioExam.id);
    try {
      const updated = await adminService.uploadListeningAudio(selectedAudioExam, file);
      setExams(p => p.map(e => e.id === updated.id ? updated : e));
      toast.success("Upload audio Listening thành công");
    } catch (err) {
      const message = (err as { message?: string })?.message;
      toast.error(message || "Upload audio thất bại");
    } finally {
      setUploadingAudioExamId(null);
      setSelectedAudioExam(null);
      if (listeningAudioInputRef.current) {
        listeningAudioInputRef.current.value = "";
      }
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

  const examRows = (() => {
    if (filterExamSkill !== "all") {
      return filteredExams.map(e => ({ type: "individual" as const, data: e }));
    }

    const result: Array<
      | { type: "individual"; data: Exam }
      | { type: "group"; groupId: string; groupTitle: string; difficulty: string; status: string; uploadedAt: string; exams: Exam[] }
    > = [];
    
    const groups: Record<string, Exam[]> = {};

    filteredExams.forEach(e => {
      if (e.mode === "mock_test" && e.groupId) {
        if (!groups[e.groupId]) {
          groups[e.groupId] = [];
        }
        groups[e.groupId].push(e);
      } else {
        result.push({ type: "individual" as const, data: e });
      }
    });

    Object.entries(groups).forEach(([groupId, groupExams]) => {
      const firstExam = groupExams[0];
      const groupTitle = firstExam.groupTitle || firstExam.title.replace(/\s*-\s*(Listening|Reading|Writing|Speaking|Writing Task 1|Writing Task 2|Speaking Part 1|Speaking Part 2|Speaking Part 3)$/i, "");
      
      result.push({
        type: "group" as const,
        groupId,
        groupTitle,
        difficulty: firstExam.difficulty,
        status: groupExams.some(ex => ex.status === "active") ? "active" : "draft",
        uploadedAt: firstExam.uploadedAt,
        exams: groupExams,
      });
    });

    result.sort((a, b) => {
      const timeA = a.type === "individual" ? a.data.uploadedAt : a.uploadedAt;
      const timeB = b.type === "individual" ? b.data.uploadedAt : b.uploadedAt;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    return result;
  })();

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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
              {skill === "Listening" && "Cấu hình đề thi nghe với file audio và đáp án trắc nghiệm"}
              {skill === "Reading" && "Cấu hình đề thi đọc với passage và đáp án trắc nghiệm"}
              {skill === "Writing" && "Cấu hình đề thi viết với Task 1 và Task 2 tự luận"}
              {skill === "Speaking" && "Cấu hình đề thi nói với 3 Part phỏng vấn trực tiếp"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Tên đề thi</Label>
          <Input value={examForm.title} onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))} placeholder={`Đề thi ${skill} #...`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Độ khó</Label>
            <Select value={examForm.difficulty} onValueChange={v => setExamForm(p => ({ ...p, difficulty: v }))}>
              <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Dễ">Dễ</SelectItem>
                <SelectItem value="Trung bình">Trung bình</SelectItem>
                <SelectItem value="Khó">Khó</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Trạng thái</Label>
            <Select value={examForm.status} onValueChange={v => setExamForm(p => ({ ...p, status: v as "active" | "draft" }))}>
              <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
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
              <Label className="text-xs font-semibold">Số câu hỏi</Label>
              <Input type="number" value={examForm.questions} onChange={e => setExamForm(p => ({ ...p, questions: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">File đề thi DOCX (chứa 3 Part)</Label>
              <input
                ref={listeningDocxInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={e => setListeningDocxFile(e.target.files?.[0] ?? null)}
              />
              <div
                onClick={() => listeningDocxInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
              >
                <FileText size={24} className="mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-medium text-foreground">
                  {listeningDocxFile ? listeningDocxFile.name : "Nhấn để chọn file đề thi .docx"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ℹ️ Đáp án đúng (ANSWER: A/B/C/D) sẽ được đọc tự động từ file DOCX.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">File Audio nghe</Label>
              <input
                ref={listeningImportAudioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.webm,.ogg,.m4a"
                className="hidden"
                onChange={e => setListeningAudioFile(e.target.files?.[0] ?? null)}
              />
              <div
                onClick={() => listeningImportAudioInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
              >
                <FileAudio size={24} className="mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-medium text-foreground">
                  {listeningAudioFile ? listeningAudioFile.name : "Nhấn để chọn file nghe .mp3/.wav/.m4a/.webm/.ogg"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Hỗ trợ tối đa 50MB</p>
              </div>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <span className="text-base leading-none">ℹ️</span>
              <p>Đáp án đúng cho Listening sẽ được tự động tích hợp từ file DOCX của đề thi. Hệ thống sẽ ẩn đáp án trong suốt quá trình làm bài và chỉ hiển thị sau khi học viên nộp bài thành công.</p>
            </div>
          </>
        )}

        {skill === "Reading" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Số câu hỏi</Label>
              <Input type="number" value={examForm.questions} onChange={e => setExamForm(p => ({ ...p, questions: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">File đề thi DOCX (chứa 4 Passage)</Label>
              <input
                ref={readingDocxInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={e => setReadingDocxFile(e.target.files?.[0] ?? null)}
              />
              <div
                onClick={() => readingDocxInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
              >
                <FileText size={24} className="mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-medium text-foreground">
                  {readingDocxFile ? readingDocxFile.name : "Nhấn để chọn file đề thi .docx"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ℹ️ Đáp án đúng (ANSWER: A/B/C/D) sẽ được đọc tự động từ file DOCX.</p>
              </div>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <span className="text-base leading-none">ℹ️</span>
              <p>Đáp án đúng cho Reading sẽ được tự động tích hợp từ file DOCX của đề thi. Hệ thống sẽ ẩn đáp án trong suốt quá trình làm bài và chỉ hiển thị sau khi học viên nộp bài thành công.</p>
            </div>
          </>
        )}

        {skill === "Writing" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Thời gian làm bài (phút)</Label>
              <Input type="number" value={examForm.duration} onChange={e => setExamForm(p => ({ ...p, duration: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Task 1 - Đề bài (Thư/Email hoặc Tóm tắt)</Label>
              <Textarea value={examForm.writingTask1} onChange={e => setExamForm(p => ({ ...p, writingTask1: e.target.value }))} placeholder="Mô tả đề bài viết thư hoặc email cho Task 1..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Task 2 - Đề bài (Bài luận 250 - 300 từ)</Label>
              <Textarea value={examForm.writingTask2} onChange={e => setExamForm(p => ({ ...p, writingTask2: e.target.value }))} placeholder="Mô tả chủ đề essay cho Task 2..." rows={4} />
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <span className="text-base leading-none">📝</span>
              <p>Phần thi Writing không có đáp án trắc nghiệm khách quan. Bài làm của học viên sẽ được lưu trữ và chấm thủ công bởi giám khảo hoặc chấm tự động qua trợ lý chấm AI.</p>
            </div>
          </>
        )}

        {skill === "Speaking" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Thời gian thi (phút)</Label>
              <Input type="number" value={examForm.duration} onChange={e => setExamForm(p => ({ ...p, duration: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part 1 - Tương tác xã hội</Label>
              <Textarea value={examForm.speakingPart1} onChange={e => setExamForm(p => ({ ...p, speakingPart1: e.target.value }))} placeholder="Các câu hỏi cho Part 1 (mỗi câu một dòng)..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part 2 - Thảo luận giải pháp</Label>
              <Textarea value={examForm.speakingPart2} onChange={e => setExamForm(p => ({ ...p, speakingPart2: e.target.value }))} placeholder="Tình huống và 3 giải pháp đề xuất cho Part 2..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part 3 - Phát triển chủ đề & Câu hỏi mở rộng</Label>
              <Textarea value={examForm.speakingPart3} onChange={e => setExamForm(p => ({ ...p, speakingPart3: e.target.value }))} placeholder="Chủ đề phát triển ý và các câu hỏi phụ mở rộng..." rows={3} />
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <span className="text-base leading-none">📝</span>
              <p>Phần thi Speaking không có đáp án trắc nghiệm khách quan. Bài làm ghi âm của học viên sẽ được lưu trữ và chấm thủ công bởi giám khảo hoặc chấm tự động qua trợ lý chấm AI.</p>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMockTestWizard = () => {
    switch (examStep) {
      case "mt_info":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên đề thi thử chung</Label>
              <Input
                value={mockTestForm.title}
                onChange={e => {
                  const val = e.target.value;
                  setMockTestForm(p => ({
                    ...p,
                    title: val,
                    listening: { ...p.listening, title: val ? `${val} - Listening` : "" },
                    reading: { ...p.reading, title: val ? `${val} - Reading` : "" },
                    writing: { ...p.writing, title: val ? `${val} - Writing` : "" },
                    speaking: { ...p.speaking, title: val ? `${val} - Speaking` : "" },
                  }));
                }}
                placeholder="Ví dụ: Đề thi thử VstepUp Số 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Độ khó</Label>
                <Select value={mockTestForm.difficulty} onValueChange={v => setMockTestForm(p => ({ ...p, difficulty: v }))}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dễ">Dễ</SelectItem>
                    <SelectItem value="Trung bình">Trung bình</SelectItem>
                    <SelectItem value="Khó">Khó</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Trạng thái</Label>
                <Select value={mockTestForm.status} onValueChange={v => setMockTestForm(p => ({ ...p, status: v as "active" | "draft" }))}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
              <Button variant="outline" onClick={() => setExamStep("mode")}>Quay lại</Button>
              <Button onClick={() => {
                if (!mockTestForm.title) {
                  toast.error("Vui lòng nhập tên đề thi thử");
                  return;
                }
                setExamStep("mt_listening");
              }} className="gradient-primary text-primary-foreground">Tiếp theo: Listening</Button>
            </div>
          </div>
        );

      case "mt_listening":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên phần thi Nghe</Label>
              <Input
                value={mockTestForm.listening.title}
                onChange={e => setMockTestForm(p => ({ ...p, listening: { ...p.listening, title: e.target.value } }))}
                placeholder="Ví dụ: Đề thi thử VstepUp Số 1 - Listening"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">File đề thi DOCX (Listening - chứa 3 Part)</Label>
              <div
                onClick={() => mtListeningDocxRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
              >
                <FileText size={24} className="mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-medium text-foreground">
                  {mockTestForm.listening.docxFile ? mockTestForm.listening.docxFile.name : "Nhấn để chọn file đề thi .docx"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ℹ️ Đáp án đúng (ANSWER: A/B/C/D) sẽ được đọc tự động từ file DOCX.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">File Audio nghe</Label>
              <div
                onClick={() => mtListeningAudioRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
              >
                <FileAudio size={24} className="mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-medium text-foreground">
                  {mockTestForm.listening.audioFile ? mockTestForm.listening.audioFile.name : "Nhấn để chọn file nghe .mp3/.wav"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Hỗ trợ tối đa 50MB</p>
              </div>
            </div>
            <div className="flex justify-between gap-2 pt-4 border-t border-border/60">
              <Button variant="outline" onClick={() => setExamStep("mt_info")}>Quay lại</Button>
              <Button onClick={() => {
                if (!mockTestForm.listening.docxFile) {
                  toast.error("Vui lòng chọn file đề thi DOCX");
                  return;
                }
                if (!mockTestForm.listening.audioFile) {
                  toast.error("Vui lòng chọn file audio");
                  return;
                }
                setExamStep("mt_reading");
              }} className="gradient-primary text-primary-foreground">Tiếp theo: Reading</Button>
            </div>
          </div>
        );

      case "mt_reading":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên phần thi Đọc</Label>
              <Input
                value={mockTestForm.reading.title}
                onChange={e => setMockTestForm(p => ({ ...p, reading: { ...p.reading, title: e.target.value } }))}
                placeholder="Ví dụ: Đề thi thử VstepUp Số 1 - Reading"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">File đề thi DOCX (Reading - chứa 4 Passage)</Label>
              <div
                onClick={() => mtReadingDocxRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
              >
                <FileText size={24} className="mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-medium text-foreground">
                  {mockTestForm.reading.docxFile ? mockTestForm.reading.docxFile.name : "Nhấn để chọn file đề thi .docx"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ℹ️ Đáp án đúng (ANSWER: A/B/C/D) sẽ được đọc tự động từ file DOCX.</p>
              </div>
            </div>
            <div className="flex justify-between gap-2 pt-4 border-t border-border/60">
              <Button variant="outline" onClick={() => setExamStep("mt_listening")}>Quay lại</Button>
              <Button onClick={() => {
                if (!mockTestForm.reading.docxFile) {
                  toast.error("Vui lòng chọn file đề thi DOCX");
                  return;
                }
                setExamStep("mt_writing");
              }} className="gradient-primary text-primary-foreground">Tiếp theo: Writing</Button>
            </div>
          </div>
        );

      case "mt_writing":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên phần thi Viết</Label>
              <Input
                value={mockTestForm.writing.title}
                onChange={e => setMockTestForm(p => ({ ...p, writing: { ...p.writing, title: e.target.value } }))}
                placeholder="Ví dụ: Đề thi thử VstepUp Số 1 - Writing"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Task 1 - Đề bài viết thư/email</Label>
              <Textarea
                value={mockTestForm.writing.writingTask1}
                onChange={e => setMockTestForm(p => ({ ...p, writing: { ...p.writing, writingTask1: e.target.value } }))}
                placeholder="Nhập đề bài viết thư hoặc email..."
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Task 2 - Đề bài viết bài luận (Essay)</Label>
              <Textarea
                value={mockTestForm.writing.writingTask2}
                onChange={e => setMockTestForm(p => ({ ...p, writing: { ...p.writing, writingTask2: e.target.value } }))}
                placeholder="Nhập đề bài essay..."
                rows={5}
              />
            </div>
            <div className="flex justify-between gap-2 pt-4 border-t border-border/60">
              <Button variant="outline" onClick={() => setExamStep("mt_reading")}>Quay lại</Button>
              <Button onClick={() => {
                if (!mockTestForm.writing.writingTask1 || !mockTestForm.writing.writingTask2) {
                  toast.error("Vui lòng nhập đề bài viết cho cả Task 1 và Task 2");
                  return;
                }
                setExamStep("mt_speaking");
              }} className="gradient-primary text-primary-foreground">Tiếp theo: Speaking</Button>
            </div>
          </div>
        );

      case "mt_speaking":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên phần thi Nói</Label>
              <Input
                value={mockTestForm.speaking.title}
                onChange={e => setMockTestForm(p => ({ ...p, speaking: { ...p.speaking, title: e.target.value } }))}
                placeholder="Ví dụ: Đề thi thử VstepUp Số 1 - Speaking"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part 1 - Tương tác xã hội</Label>
              <Textarea
                value={mockTestForm.speaking.speakingPart1}
                onChange={e => setMockTestForm(p => ({ ...p, speaking: { ...p.speaking, speakingPart1: e.target.value } }))}
                placeholder="Các câu hỏi cho Part 1..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part 2 - Thảo luận giải pháp</Label>
              <Textarea
                value={mockTestForm.speaking.speakingPart2}
                onChange={e => setMockTestForm(p => ({ ...p, speaking: { ...p.speaking, speakingPart2: e.target.value } }))}
                placeholder="Tình huống và các giải pháp đề xuất..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part 3 - Phát triển chủ đề & mở rộng</Label>
              <Textarea
                value={mockTestForm.speaking.speakingPart3}
                onChange={e => setMockTestForm(p => ({ ...p, speaking: { ...p.speaking, speakingPart3: e.target.value } }))}
                placeholder="Chủ đề và các câu hỏi phụ mở rộng..."
                rows={3}
              />
            </div>
            <div className="flex justify-between gap-2 pt-4 border-t border-border/60">
              <Button variant="outline" onClick={() => setExamStep("mt_writing")}>Quay lại</Button>
              <Button onClick={() => {
                if (!mockTestForm.speaking.speakingPart1 || !mockTestForm.speaking.speakingPart2 || !mockTestForm.speaking.speakingPart3) {
                  toast.error("Vui lòng nhập đầy đủ câu hỏi cho cả 3 phần Speaking");
                  return;
                }
                setExamStep("mt_confirm");
              }} className="gradient-primary text-primary-foreground">Tiếp theo: Xác nhận</Button>
            </div>
          </div>
        );

      case "mt_confirm":
        return (
          <div className="space-y-4">
            <div className="bg-muted/40 p-4 rounded-xl space-y-3 border border-border">
              <h4 className="font-bold text-sm text-foreground">Tóm tắt đề thi thử</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><span className="text-muted-foreground">Tên đề:</span> <strong className="text-foreground">{mockTestForm.title}</strong></div>
                <div><span className="text-muted-foreground">Độ khó:</span> <strong className="text-foreground">{mockTestForm.difficulty}</strong></div>
                <div><span className="text-muted-foreground">Trạng thái:</span> <strong className="text-foreground">{mockTestForm.status}</strong></div>
                <div className="col-span-2 border-t border-border my-1 pt-1"></div>
                <div><span className="text-muted-foreground">🎧 Listening:</span> <span className="text-foreground">{mockTestForm.listening.docxFile?.name}</span></div>
                <div><span className="text-muted-foreground">🔊 Audio:</span> <span className="text-foreground">{mockTestForm.listening.audioFile?.name}</span></div>
                <div><span className="text-muted-foreground">📖 Reading:</span> <span className="text-foreground">{mockTestForm.reading.docxFile?.name}</span></div>
                <div><span className="text-muted-foreground">✍️ Writing:</span> <span className="text-foreground">Sẵn sàng (2 task)</span></div>
                <div><span className="text-muted-foreground">🎙️ Speaking:</span> <span className="text-foreground">Sẵn sàng (3 part)</span></div>
              </div>
            </div>

            {isUploadingMockTest && (
              <div className="space-y-2 py-2">
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <span>{uploadProgress}</span>
                  <span className="animate-pulse">Đang xử lý...</span>
                </div>
                <Progress value={
                  uploadProgress.includes("Listening") ? 25 :
                  uploadProgress.includes("audio") ? 45 :
                  uploadProgress.includes("Reading") ? 70 :
                  uploadProgress.includes("Writing") ? 85 : 95
                } className="h-1.5" />
              </div>
            )}

            <div className="flex justify-between gap-2 pt-4 border-t border-border/60">
              <Button variant="outline" disabled={isUploadingMockTest} onClick={() => setExamStep("mt_speaking")}>Quay lại</Button>
              <Button
                onClick={saveMockTest}
                disabled={isUploadingMockTest}
                className="gradient-primary text-primary-foreground gap-1.5 shadow-sm"
              >
                {isUploadingMockTest ? (
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></span>
                ) : (
                  <Save size={14} />
                )}
                Đăng đề thi thử
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isInitialising) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang khởi tạo phiên làm việc...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <Sidebar collapsible="icon" className="border-r border-border border-l-4 border-l-primary transition-all duration-300">
          <SidebarContent className="flex flex-col h-full bg-gradient-to-b from-blue-50/40 via-indigo-50/20 to-background dark:from-slate-900/40 dark:via-indigo-950/10 dark:to-background">
            <div className="p-4 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <Link to="/" className="flex items-center gap-2.5">
                <img src={logoImg} alt="VstepUp" className="w-9 h-9 rounded-xl object-contain shrink-0 group-data-[collapsible=icon]:mx-auto shadow-sm" />
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="font-extrabold text-foreground text-sm tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">VstepUp</span>
                  <span className="text-[10px] text-muted-foreground leading-tight font-medium">Admin Panel</span>
                </div>
              </Link>
            </div>

            <Separator className="mx-4 w-auto group-data-[collapsible=icon]:hidden opacity-60" />

            <SidebarGroup className="flex-1 pt-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.value}>
                       <SidebarMenuButton
                        onClick={() => setActiveTab(item.value)}
                        className={`cursor-pointer h-10 rounded-lg transition-all duration-200 flex items-center justify-center md:justify-start ${
                          activeTab === item.value
                            ? "bg-primary/10 text-primary font-bold shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 shrink-0 ${item.color || "text-muted-foreground"}`} />
                        <span className="md:block hidden group-data-[collapsible=icon]:hidden font-medium text-xs">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="p-3 border-t border-border bg-muted/20 dark:bg-muted/5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-none">
              <div className="flex flex-col md:flex-row items-center gap-2.5 px-1 md:px-2 w-full group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:justify-center">
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9 md:h-9 md:w-9 ring-2 ring-primary/20 shrink-0 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!h-9">
                    {user?.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white text-xs font-bold">{user?.name?.charAt(0) || "A"}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                </div>
                <div className="flex-1 min-w-0 hidden md:block text-center md:text-left group-data-[collapsible=icon]:!hidden">
                  <div className="flex items-center gap-1.5 justify-center md:justify-start">
                    <p className="text-xs font-bold text-foreground truncate">{user?.name || "Administrator"}</p>
                    <Badge className="text-[8px] px-1 py-0 bg-primary/20 text-primary border-none font-bold hover:bg-primary/20">Admin</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email || "admin@vstepup.vn"}</p>
                </div>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b border-border px-4 bg-card/85 backdrop-blur-md sticky top-0 z-30 gap-4">
            <SidebarTrigger />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">VstepUp</span>
                <span className="text-xs text-muted-foreground">/</span>
                <h1 className="font-bold text-sm text-foreground">
                  {sidebarItems.find(i => i.value === activeTab)?.title}
                </h1>
              </div>
              {activeTab === "dashboard" && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full hidden md:inline-flex items-center gap-1">
                  Xin chào, {user?.name || "Admin"}! 👋 Hôm nay có <span className="font-extrabold">{exams.filter(e => e.status === "draft").length}</span> đề nháp cần duyệt.
                </span>
              )}
            </div>
            
            <div className="ml-auto flex items-center gap-3">
              
              <div className="relative">
                <Button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="ghost" 
                  size="icon" 
                  className={`relative hover:bg-muted rounded-full transition-colors ${showNotifications ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Bell size={16} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                  )}
                </Button>
                
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-card text-card-foreground border border-border rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                        <span className="font-bold text-xs text-foreground">Thông báo ({unreadNotificationsCount})</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg"
                          onClick={() => {
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            toast.success("Đã đánh dấu tất cả là đã đọc");
                          }}
                        >
                          Đánh dấu đã đọc
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                            }}
                            className={`p-2.5 rounded-xl text-[11px] hover:bg-muted/50 transition-colors cursor-pointer border border-transparent ${!n.read ? "bg-primary/5 border-primary/10" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`font-bold ${!n.read ? "text-primary" : "text-foreground"}`}>{n.title}</span>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />}
                            </div>
                            <p className="text-muted-foreground text-[10px] mt-1 leading-normal">{n.message}</p>
                            <span className="text-[9px] text-muted-foreground/80 block mt-1.5">{n.time}</span>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <div className="text-center py-6 text-xs text-muted-foreground">Không có thông báo mới</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-1.5 text-muted-foreground hover:text-foreground">
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
                    { label: "Tổng học viên", value: totalStudents, sub: `${activeStudents} đang hoạt động`, icon: Users, trend: "+12%", up: true, color: "from-blue-500 to-indigo-600", accent: "bg-blue-600", glow: "hover:shadow-blue-500/10", spark: "M5,15 L15,10 L25,18 L35,8 L45,12 L55,5" },
                    { label: "Đề thi", value: totalExams, sub: `${activeExams} đang active`, icon: FileText, trend: "+3", up: true, color: "from-emerald-500 to-teal-600", accent: "bg-emerald-600", glow: "hover:shadow-emerald-500/10", spark: "M5,12 L15,15 L25,10 L35,14 L45,6 L55,3" },
                    { label: "Doanh thu tháng", value: `${(totalRevenue / 1e6).toFixed(1)}M`, sub: "VND", icon: DollarSign, trend: `+${monthlyGrowth}%`, up: true, color: "from-amber-500 to-orange-600", accent: "bg-amber-600", glow: "hover:shadow-amber-500/10", spark: "M5,18 L15,14 L25,15 L35,10 L45,8 L55,4" },
                    { label: "Lượt thi hôm nay", value: 28, sub: "↑ so với hôm qua", icon: Activity, trend: "+5", up: true, color: "from-purple-500 to-violet-600", accent: "bg-purple-600", glow: "hover:shadow-purple-500/10", spark: "M5,16 L15,8 L25,12 L35,15 L45,6 L55,2" },
                  ].map((stat, i) => (
                    <Card key={stat.label} className={`border border-border/80 overflow-hidden relative group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${stat.glow}`} style={{ animationDelay: `${i * 100}ms` }}>
                      <CardContent className="p-5 relative">
                        <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${stat.color} rounded-r`} />
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <stat.icon size={20} />
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${stat.up ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                              {stat.up ? <ChevronUp size={10} /> : <ChevronDown size={10} />}{stat.trend}
                            </span>
                            <svg className="w-14 h-6 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" viewBox="0 0 60 20" fill="none">
                              <path d={stat.spark} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none">{stat.value}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                          <p className="text-[10px] text-muted-foreground/80">{stat.sub}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Thống kê nhanh row - NEW */}
                <div className="bg-muted/30 dark:bg-muted/10 border border-border/80 rounded-2xl p-4 flex flex-wrap items-center justify-around gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Học viên Online</p>
                      <p className="text-base font-extrabold text-foreground">12 <span className="text-xs font-normal text-muted-foreground">người</span></p>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-8 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <Activity size={18} className="text-indigo-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lượt thi hôm nay</p>
                      <p className="text-base font-extrabold text-foreground">28 <span className="text-xs font-normal text-emerald-600">↑ 15%</span></p>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-8 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <Plus size={18} className="text-emerald-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Đề mới tuần này</p>
                      <p className="text-base font-extrabold text-foreground">4 <span className="text-xs font-normal text-muted-foreground">đề đã duyệt</span></p>
                    </div>
                  </div>
                </div>

                {/* Đề thi theo kỹ năng - NEW Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <BookOpen size={16} className="text-primary" /> Đề thi theo kỹ năng
                    </h3>
                    <span className="text-xs text-muted-foreground">Target: 20 đề mỗi kỹ năng</span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: "Listening", desc: "Đề thi nghe 3 phần", icon: Headphones, count: exams.filter(e => e.skill === "Listening").length, target: 20, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 text-blue-600", btn: "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20" },
                      { name: "Reading", desc: "Bài đọc 4 Passage", icon: BookOpenCheck, count: exams.filter(e => e.skill === "Reading").length, target: 20, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10 text-emerald-600", btn: "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" },
                      { name: "Writing", desc: "Thư/Email & Essay", icon: PenTool, count: exams.filter(e => e.skill === "Writing").length, target: 20, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10 text-amber-600", btn: "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20" },
                      { name: "Speaking", desc: "Phỏng vấn & Thảo luận", icon: Mic, count: exams.filter(e => e.skill === "Speaking").length, target: 20, color: "from-purple-500 to-fuchsia-500", bg: "bg-purple-500/10 text-purple-600", btn: "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20" },
                    ].map((s) => {
                      const pct = Math.min(Math.round((s.count / s.target) * 100), 100);
                      return (
                        <Card key={s.name} className="border border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                          <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold text-foreground">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground leading-normal">{s.desc}</p>
                              </div>
                              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                                <s.icon size={16} />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                                <span>Tiến độ target</span>
                                <span>{s.count}/{s.target} ({pct}%)</span>
                              </div>
                              <Progress value={pct} className="h-1.5" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
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
                    <input
                      ref={readingDocxInputRef}
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={e => importReadingDocx(e.target.files?.[0])}
                    />
                    <input
                      ref={listeningAudioInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.webm,.ogg,.m4a"
                      className="hidden"
                      onChange={e => uploadListeningAudio(e.target.files?.[0])}
                    />
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
                          <TableHead className="text-xs font-semibold">Phân loại</TableHead>
                          <TableHead className="text-xs font-semibold">Độ khó</TableHead>
                          <TableHead className="text-xs font-semibold">Đáp án</TableHead>
                          <TableHead className="text-xs font-semibold">Số câu</TableHead>
                          <TableHead className="text-xs font-semibold">Trạng thái</TableHead>
                          <TableHead className="text-xs font-semibold"><Clock size={12} className="inline mr-1" />Upload</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examRows.map(row => {
                          if (row.type === "individual") {
                            const e = row.data;
                            const SkillIcon = skillIcons[e.skill] || FileText;
                            const color = skillColors[e.skill] || "";
                            const isQuiz = e.skill === "Listening" || e.skill === "Reading";
                            return (
                              <TableRow key={e.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="font-medium text-sm">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-foreground">{e.title}</span>
                                    {e.skill === "Listening" && e.audioUrl && (
                                      <span className="text-[10px] text-primary truncate max-w-[200px] mt-0.5">🎧 Audio: {e.audioUrl.split('/').pop()}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${color}`}>
                                    <SkillIcon size={12} /> {e.skill}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-[10px] ${e.mode === "mock_test" ? "border-blue-200 text-blue-600 bg-blue-50/50" : "border-emerald-200 text-emerald-600 bg-emerald-50/50"}`}>
                                    {e.mode === "mock_test" ? "Thi thử 🏆" : "Luyện đề 📚"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    e.difficulty === "Dễ" ? "bg-emerald-500/10 text-emerald-600" :
                                    e.difficulty === "Trung bình" ? "bg-amber-500/10 text-amber-600" :
                                    "bg-red-500/10 text-red-600"
                                  }`}>{e.difficulty}</span>
                                </TableCell>
                                <TableCell>
                                  {isQuiz ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none text-[10px] flex items-center gap-1 w-fit">
                                      <span>✅ Có đáp án</span>
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-none text-[10px] flex items-center gap-1 w-fit">
                                      <span>📝 Chấm tay</span>
                                    </Badge>
                                  )}
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
                                    {e.skill === "Listening" && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => openListeningAudioUpload(e)}
                                        disabled={uploadingAudioExamId === e.id}
                                        title="Thêm audio Listening"
                                      >
                                        <FileAudio size={13} />
                                      </Button>
                                    )}
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditExam(e)}><Edit2 size={13} /></Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteExam(e.id)}><Trash2 size={13} /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          } else {
                            const isExpanded = !!expandedGroups[row.groupId];
                            const skillsPresent = row.exams.map(e => e.skill);
                            const totalQuestions = row.exams.reduce((acc, curr) => acc + curr.questions, 0);
                            return (
                              <Fragment key={row.groupId}>
                                <TableRow className="bg-blue-50/10 dark:bg-blue-950/5 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-colors border-l-4 border-l-blue-500">
                                  <TableCell className="font-medium text-sm">
                                    <div className="flex items-center gap-2">
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleGroup(row.groupId)}>
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      </Button>
                                      <span className="font-bold text-foreground">{row.groupTitle}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      {["Listening", "Reading", "Writing", "Speaking"].map(skill => {
                                        const present = skillsPresent.includes(skill);
                                        return (
                                          <Badge
                                            key={skill}
                                            variant="outline"
                                            className={`text-[10px] px-1 py-0.5 ${
                                              present
                                                ? skillColors[skill] || ""
                                                : "bg-muted/40 text-muted-foreground border-dashed"
                                            }`}
                                          >
                                            {skill === "Listening" ? "🎧" : skill === "Reading" ? "📖" : skill === "Writing" ? "✍️" : "🎙️"}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="text-[10px] bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-blue-500/20">
                                      Thi thử 🏆
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">{row.difficulty}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/10 border-none text-[10px]">
                                      Tích hợp 4 kỹ năng
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{totalQuestions} câu</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${row.status === "active" ? "bg-emerald-500" : "bg-amber-400"}`} />
                                      <span className="text-xs">{row.status === "active" ? "Active" : "Draft"}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{row.uploadedAt}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs px-2"
                                        onClick={() => toggleGroup(row.groupId)}
                                      >
                                        {isExpanded ? "Thu gọn" : "Chi tiết"}
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteExamGroup(row.groupId)}
                                        title="Xóa cả bộ thi thử"
                                      >
                                        <Trash2 size={13} />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>

                                {isExpanded && row.exams.map(e => {
                                  const SkillIcon = skillIcons[e.skill] || FileText;
                                  const color = skillColors[e.skill] || "";
                                  const isQuiz = e.skill === "Listening" || e.skill === "Reading";
                                  return (
                                    <TableRow key={e.id} className="bg-muted/10 hover:bg-muted/20 transition-colors border-l-4 border-l-blue-300">
                                      <TableCell className="font-medium text-sm pl-10">
                                        <div className="flex flex-col">
                                          <span className="text-foreground/90 font-medium">{e.title}</span>
                                          {e.skill === "Listening" && e.audioUrl && (
                                            <span className="text-[10px] text-primary truncate max-w-[200px] mt-0.5">🎧 Audio: {e.audioUrl.split('/').pop()}</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${color}`}>
                                          <SkillIcon size={12} /> {e.skill}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-[10px] text-muted-foreground">— Sub-skill</span>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-xs text-muted-foreground">{e.difficulty}</span>
                                      </TableCell>
                                      <TableCell>
                                        {isQuiz ? (
                                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none text-[10px] flex items-center gap-1 w-fit">
                                            <span>✅ Có đáp án</span>
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-none text-[10px] flex items-center gap-1 w-fit">
                                            <span>📝 Chấm tay</span>
                                          </Badge>
                                        )}
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
                                          {e.skill === "Listening" && (
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-7 w-7"
                                              onClick={() => openListeningAudioUpload(e)}
                                              disabled={uploadingAudioExamId === e.id}
                                              title="Thêm audio Listening"
                                            >
                                              <FileAudio size={13} />
                                            </Button>
                                          )}
                                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditExam(e)}><Edit2 size={13} /></Button>
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteExam(e.id)}><Trash2 size={13} /></Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </Fragment>
                            );
                          }
                        })}
                        {examRows.length === 0 && (
                          <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">Không tìm thấy kết quả</TableCell></TableRow>
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
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} disabled={!!editUser} /></div>
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
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-border/80 rounded-2xl shadow-xl">
          <DialogHeader className="border-b border-border/60 pb-3">
            <DialogTitle className="flex items-center justify-between text-lg font-bold text-foreground">
              <span>
                {editExam
                  ? "Chỉnh sửa đề thi"
                  : examStep === "mode"
                  ? "Bước 1: Chọn chế độ thi"
                  : examStep === "skill"
                  ? "Bước 2: Chọn kỹ năng"
                  : `Bước 3: Cấu hình đề ${examForm.skill}`}
              </span>
              {!editExam && examStep === "form" && (
                <Badge className={examMode === "practice" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-blue-500/20"}>
                  {examMode === "practice" ? "📚 Luyện đề" : "🏆 Thi thử"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-4 pr-1 -mr-2 space-y-4">
            {/* Step 1: Choose mode */}
            {!editExam && examStep === "mode" && (
              <div className="grid grid-cols-2 gap-4 py-2">
                <button
                  onClick={() => {
                    setExamMode("practice");
                    setExamForm(p => ({ ...p, mode: "practice" }));
                    setExamStep("skill");
                  }}
                  className="p-6 rounded-2xl border-2 border-border hover:border-emerald-500/40 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center gap-4 text-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <GraduationCap size={28} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-base font-bold text-foreground block">📚 Luyện đề</span>
                    <span className="text-xs text-muted-foreground block leading-relaxed">
                      Luyện tập riêng lẻ từng kỹ năng, không giới hạn thời gian. Phù hợp tự học hàng ngày.
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setExamMode("mock_test");
                    setMockTestForm({
                      title: "",
                      difficulty: "Trung bình",
                      status: "draft",
                      listening: { title: "", docxFile: null, audioFile: null },
                      reading: { title: "", docxFile: null },
                      writing: { title: "", writingTask1: "", writingTask2: "" },
                      speaking: { title: "", speakingPart1: "", speakingPart2: "", speakingPart3: "" },
                    });
                    setExamStep("mt_info");
                  }}
                  className="p-6 rounded-2xl border-2 border-border hover:border-blue-500/40 hover:bg-blue-50/10 dark:hover:bg-blue-950/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center gap-4 text-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <Shield size={28} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-base font-bold text-foreground block">🏆 Thi thử</span>
                    <span className="text-xs text-muted-foreground block leading-relaxed">
                      Đề thi chuẩn VSTEP đầy đủ các phần. Áp dụng đếm ngược thời gian nghiêm ngặt.
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Step 2: Choose skill */}
            {!editExam && examStep === "skill" && (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" className="w-fit gap-1 text-xs text-muted-foreground -mt-2 hover:bg-muted" onClick={() => setExamStep("mode")}>
                  <ArrowLeft size={14} /> Quay lại Bước 1
                </Button>
                <div className="grid grid-cols-2 gap-4 py-2">
                  {(["Listening", "Reading", "Writing", "Speaking"] as const).map(skill => {
                    const Icon = skillIcons[skill];
                    const color = skillColors[skill];
                    return (
                      <button
                        key={skill}
                        onClick={() => {
                          setExamForm(p => ({ ...p, skill }));
                          setExamStep("form");
                        }}
                        className={`p-5 rounded-2xl border-2 border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center gap-3 group`}
                      >
                        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                          <Icon size={22} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{skill}</span>
                        <span className="text-[11px] text-muted-foreground text-center">
                          {skill === "Listening" && "3 phần - 35 câu (40 phút)"}
                          {skill === "Reading" && "4 bài đọc - 40 câu (60 phút)"}
                          {skill === "Writing" && "2 task viết luận (60 phút)"}
                          {skill === "Speaking" && "3 phần thi nói (12-15 phút)"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Skill-specific form */}
            {(editExam || examStep === "form") && (
              <div className="space-y-5">
                {!editExam && (
                  <Button variant="ghost" size="sm" className="w-fit gap-1 text-xs text-muted-foreground -mt-2 hover:bg-muted" onClick={() => setExamStep("skill")}>
                    <ArrowLeft size={14} /> Quay lại Chọn kỹ năng
                  </Button>
                )}
                {renderSkillForm()}
                <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
                  <Button variant="outline" onClick={() => setExamDialog(false)}>Hủy</Button>
                  <Button
                    onClick={saveExam}
                    disabled={isImportingListening}
                    className="gradient-primary text-primary-foreground gap-1.5 shadow-sm"
                  >
                    {isImportingListening ? (
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {isImportingListening ? "Đang import..." : "Lưu đề thi"}
                  </Button>
                </div>
              </div>
            )}

            {/* Mock Test Wizard Steps */}
            {!editExam && examStep.startsWith("mt_") && (
              <div className="space-y-5">
                <input
                  ref={mtListeningDocxRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setMockTestForm(p => ({
                      ...p,
                      listening: { ...p.listening, docxFile: file }
                    }));
                  }}
                />
                <input
                  ref={mtListeningAudioRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.webm,.ogg,.m4a"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setMockTestForm(p => ({
                      ...p,
                      listening: { ...p.listening, audioFile: file }
                    }));
                  }}
                />
                <input
                  ref={mtReadingDocxRef}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setMockTestForm(p => ({
                      ...p,
                      reading: { ...p.reading, docxFile: file }
                    }));
                  }}
                />
                {renderMockTestWizard()}
              </div>
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
