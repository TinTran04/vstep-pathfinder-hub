import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Headphones, BookOpenCheck, Pen, Mic, ArrowLeft, Clock,
  FileText, ChevronRight, Info, BookOpen, LogOut, Shield,
  Trophy, CheckCircle2, Zap, PauseCircle, RotateCcw, Star,
  RefreshCw, PackageOpen, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import logoImg from "@/assets/logo.png";

import { quizService } from "../services/quiz.service";
import { examService, type ExamItem } from "../services/exam.service";
import { type Skill } from "../mocks/quiz.mock";
import { cleanDescription } from "@/lib/utils";

const skillIcons: Record<Skill, React.ReactNode> = {
  listening: <Headphones size={24} />,
  reading: <BookOpenCheck size={24} />,
  writing: <Pen size={24} />,
  speaking: <Mic size={24} />,
};

type SkillView = "exams" | "overview";
type Mode = "practice" | "mock_test";

const difficultyColor = (d: string) => {
  if (d === "Dễ") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (d === "Trung bình") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
};

interface SkillItem {
  key: Skill;
  label: string;
  color: string;
  bgColor: string;
  desc: string;
}

interface StructureItem {
  part: string;
  content: string;
  questions: string;
  time: string;
}

interface OverviewData {
  structure: StructureItem[];
  tips: string[];
  scoring: string;
}

/* ─── Practice bullet points ─── */
const practiceBullets = [
  { icon: <PauseCircle size={14} />, text: "Có thể tạm dừng thời gian" },
  { icon: <RotateCcw size={14} />, text: "Listening được tua / nghe lại" },
  { icon: <CheckCircle2 size={14} />, text: "Xem đáp án và giải thích sau khi nộp" },
  { icon: <Star size={14} />, text: "Phù hợp để ôn luyện từng kỹ năng" },
];

/* ─── Mock Test bullet points ─── */
const mockBullets = [
  { icon: <Zap size={14} />, text: "Không thể tạm dừng thời gian" },
  { icon: <Headphones size={14} />, text: "Listening chỉ nghe một lần" },
  { icon: <Trophy size={14} />, text: "Tính điểm tổng hợp 4 kỹ năng" },
  { icon: <CheckCircle2 size={14} />, text: "Có review chi tiết sau khi hoàn thành" },
];

const Quiz = () => {
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillView, setSkillView] = useState<SkillView>("exams");
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);

  const navigate = useNavigate();
  const { isLoggedIn, isInitialising, user, logout } = useAuth();
  const skillSectionRef = useRef<HTMLDivElement>(null);

  // ── Static data (skills list + overview) ───────────────────
  const [skillsList, setSkillsList] = useState<SkillItem[]>([]);
  const [overviewDataState, setOverviewDataState] = useState<Record<Skill, OverviewData> | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Dynamic data: exams per selected skill (from real API) ─
  const [examsList, setExamsList] = useState<ExamItem[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState<string | null>(null);

  const skillRoutes: Record<Skill, string> = {
    listening: "/quiz/listening/take",
    reading: "/quiz/reading/take",
    writing: "/quiz/writing/take",
    speaking: "/quiz/speaking/take",
  };

  useEffect(() => {
    if (isInitialising) return;
    if (!isLoggedIn) navigate("/auth");
  }, [isInitialising, isLoggedIn, navigate]);

  // Load static UI data (skills list + overview — kept from mock for now)
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [s, o] = await Promise.all([
          quizService.getQuizSkills(),
          quizService.getQuizOverview(),
        ]);
        if (active) {
          setSkillsList(s);
          setOverviewDataState(o);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, []);

  // Load exams from real API whenever a skill is selected
  useEffect(() => {
    if (!selectedSkill) return;
    let active = true;
    setExamsList([]);
    setExamsError(null);
    setExamsLoading(true);

    examService
      .getExamsBySkill(selectedSkill)
      .then((items) => { if (active) { setExamsList(items); setExamsLoading(false); } })
      .catch((err: unknown) => {
        if (active) {
          const msg = (err as { message?: string })?.message;
          setExamsError(msg || "Không thể tải danh sách đề thi");
          setExamsLoading(false);
        }
      });

    return () => { active = false; };
  }, [selectedSkill]);

  /* Scroll to skill section when practice is chosen */
  useEffect(() => {
    if (selectedMode === "practice" && skillSectionRef.current) {
      setTimeout(() => {
        skillSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [selectedMode]);

  const handleSelectPractice = () => {
    setSelectedMode("practice");
    setSelectedSkill(null);
    setSkillView("exams");
  };

  const handleStartExam = (exam: ExamItem) => {
    setSelectedExam(exam);
    setConfirmDialog(true);
  };

  const confirmStart = () => {
    if (!selectedSkill || !selectedExam) return;
    navigate(`${skillRoutes[selectedSkill]}?mode=practice&examId=${selectedExam.id}`);
    setConfirmDialog(false);
  };

  if (isInitialising || !isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải dữ liệu bài thi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoImg} alt="VStepUp" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-lg text-foreground">
                VStep<span className="text-gradient">Up</span>
              </span>
            </Link>
            {selectedSkill && (
              <button
                onClick={() => { setSelectedSkill(null); setSkillView("exams"); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Chọn kỹ năng
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{user.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-8">

        {/* ─── Mode Selection Hero ─── */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground">
            Bạn muốn học theo cách nào?
          </h1>
          <p className="text-muted-foreground text-base">
            Chọn <strong>Luyện tập</strong> để rèn từng kỹ năng, hoặc <strong>Thi thử</strong> để làm bài full test như kỳ thi thật.
          </p>
        </div>

        {/* ─── 2 Mode Cards ─── */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">

          {/* Card 1 — Luyện tập */}
          <button
            onClick={handleSelectPractice}
            className={`
              group text-left rounded-2xl border-2 p-5 flex flex-col justify-between gap-4 transition-all duration-200
              hover:shadow-xl hover:-translate-y-1 w-full h-full
              ${selectedMode === "practice"
                ? "border-indigo-500 bg-indigo-50/60 shadow-lg shadow-indigo-100"
                : "border-indigo-200 bg-white hover:border-indigo-400"}
            `}
          >
            <div className="space-y-4">
              {/* Icon + Badge */}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs font-semibold">
                  Practice
                </Badge>
              </div>

              {/* Title + Desc */}
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-foreground">Luyện tập từng kỹ năng</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rèn luyện Listening, Reading, Writing, Speaking theo tốc độ của bạn.
                </p>
              </div>

              {/* Bullets */}
              <ul className="space-y-1.5">
                {practiceBullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-indigo-700">
                    <span className="text-indigo-500 shrink-0">{b.icon}</span>
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className={`
              mt-auto rounded-xl py-2 px-4 font-semibold text-xs text-center transition-all w-full
              ${selectedMode === "practice"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200"}
            `}>
              {selectedMode === "practice" ? "✓ Đang chọn luyện tập" : "Chọn luyện tập"}
            </div>
          </button>

          {/* Card 2 — Thi thử */}
          <button
            onClick={() => navigate("/mock-test")}
            className={`
              group text-left rounded-2xl border-2 p-5 flex flex-col justify-between gap-4 transition-all duration-200
              hover:shadow-xl hover:-translate-y-1 w-full h-full
              border-violet-200 bg-white hover:border-violet-400
            `}
          >
            <div className="space-y-4">
              {/* Icon + Badge */}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs font-semibold">
                  Mock Test
                </Badge>
              </div>

              {/* Title + Desc */}
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-foreground">Thi thử Full Test VSTEP</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Làm bài đủ 4 kỹ năng theo trình tự Listening → Reading → Writing → Speaking.
                </p>
              </div>

              {/* Bullets */}
              <ul className="space-y-1.5">
                {mockBullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-violet-700">
                    <span className="text-violet-500 shrink-0">{b.icon}</span>
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-auto rounded-xl py-2 px-4 font-semibold text-xs text-center w-full
              bg-violet-600 text-white group-hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
              <Trophy size={14} /> Bắt đầu thi thử
            </div>
          </button>
        </div>

        {/* ─── Practice: Skill Selection ─── */}
        <AnimatePresence>
          {selectedMode === "practice" && !selectedSkill && (
            <motion.div
              ref={skillSectionRef}
              key="skill-selection"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Chọn kỹ năng muốn luyện</h2>
                <p className="text-muted-foreground text-sm">
                  Bạn có thể tạm dừng, tua audio và xem giải thích sau khi làm bài.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto items-stretch">
                {skillsList.map((s) => (
                  <motion.div
                    key={s.key}
                    onClick={() => setSelectedSkill(s.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedSkill(s.key);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    role="button"
                    tabIndex={0}
                    className={`card-edu text-left p-5 group cursor-pointer border-2 rounded-2xl ${s.bgColor} flex flex-col justify-between h-full w-full focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  >
                    <div>
                      <div className={`w-12 h-12 rounded-xl bg-card flex items-center justify-center ${s.color} mb-3 group-hover:scale-110 transition-transform`}>
                        {skillIcons[s.key]}
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{s.label}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">{s.desc}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                      Bắt đầu luyện <ChevronRight size={14} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── No mode selected hint ─── */}
        {selectedMode === null && (
          <p className="text-center text-sm text-muted-foreground">
            💡 Hãy chọn <strong>Luyện tập</strong> để xem danh sách kỹ năng.
          </p>
        )}

        {/* ─── Skill Detail (Exam list / Overview) ─── */}
        <AnimatePresence>
          {selectedSkill && (
            <motion.div
              key="skill-detail"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Skill header */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${skillsList.find(s => s.key === selectedSkill)!.bgColor}
                    ${skillsList.find(s => s.key === selectedSkill)!.color}`}
                  >
                    {skillIcons[selectedSkill]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {skillsList.find(s => s.key === selectedSkill)!.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {examsLoading ? "Đang tải đề thi..." : `${examsList.length} đề thi có sẵn`}
                    </p>
                  </div>
                </div>

                {/* Overview / Đề thi toggle */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={skillView === "overview" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSkillView("overview")}
                    className={skillView === "overview" ? "gradient-primary text-primary-foreground" : ""}
                  >
                    <Info size={16} className="mr-1" /> Overview
                  </Button>
                  <Button
                    variant={skillView === "exams" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSkillView("exams")}
                    className={skillView === "exams" ? "gradient-primary text-primary-foreground" : ""}
                  >
                    <FileText size={16} className="mr-1" /> Đề thi
                  </Button>
                </div>
              </div>

              {skillView === "overview" ? (
                <div className="space-y-6">
                  {/* Structure table */}
                  <Card className="border-border">
                    <CardContent className="p-5">
                      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <BookOpen size={18} className="text-primary" /> Cấu trúc bài thi
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-3 font-semibold text-foreground">Phần</th>
                              <th className="text-left py-2 px-3 font-semibold text-foreground">Nội dung</th>
                              <th className="text-left py-2 px-3 font-semibold text-foreground">Số câu</th>
                              <th className="text-left py-2 px-3 font-semibold text-foreground">Thời gian</th>
                            </tr>
                          </thead>
                          <tbody>
                            {overviewDataState?.[selectedSkill]?.structure.map((row: StructureItem, i: number) => (
                              <tr key={i} className="border-b border-border/50">
                                <td className="py-2.5 px-3 font-medium text-primary">{row.part}</td>
                                <td className="py-2.5 px-3 text-foreground">{row.content}</td>
                                <td className="py-2.5 px-3 text-muted-foreground">{row.questions}</td>
                                <td className="py-2.5 px-3 text-muted-foreground">{row.time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scoring */}
                  <Card className="border-border">
                    <CardContent className="p-5">
                      <h3 className="font-bold text-foreground mb-2">📊 Thang điểm</h3>
                      <p className="text-sm text-muted-foreground">{overviewDataState?.[selectedSkill]?.scoring}</p>
                    </CardContent>
                  </Card>

                  {/* Tips */}
                  <Card className="border-border">
                    <CardContent className="p-5">
                      <h3 className="font-bold text-foreground mb-3">💡 Mẹo làm bài</h3>
                      <ul className="space-y-2">
                        {overviewDataState?.[selectedSkill]?.tips.map((tip: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary font-bold">•</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* ── Exam list (real API) ── */
                <div className="space-y-3">

                  {/* Loading skeleton */}
                  {examsLoading && (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl border border-border p-5 flex items-center gap-4 animate-pulse">
                          <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-2/3" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                            <div className="h-3 bg-muted rounded w-1/3" />
                          </div>
                          <div className="h-9 w-28 bg-muted rounded-lg shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error state */}
                  {!examsLoading && examsError && (
                    <div className="flex flex-col items-center gap-4 py-14 text-center">
                      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle size={30} className="text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Không thể tải đề thi</p>
                        <p className="text-sm text-muted-foreground mt-1">{examsError}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedSkill) {
                            setExamsError(null);
                            setExamsLoading(true);
                            examService.getExamsBySkill(selectedSkill)
                              .then(setExamsList)
                              .catch((e: unknown) => setExamsError((e as { message?: string })?.message ?? "Lỗi"))
                              .finally(() => setExamsLoading(false));
                          }
                        }}
                        className="gap-1.5"
                      >
                        <RefreshCw size={14} /> Thử lại
                      </Button>
                    </div>
                  )}

                  {/* Empty state — no exams yet */}
                  {!examsLoading && !examsError && examsList.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-5 py-14 text-center"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-primary/8 flex items-center justify-center">
                          <PackageOpen size={36} className="text-primary/60" />
                        </div>
                        {/* Pulsing dot */}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
                        </span>
                      </div>

                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="text-lg font-bold text-foreground">Đề thi đang được cập nhật</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Đội ngũ biên soạn đang chuẩn bị đề thi cho kỹ năng này.
                          Vui lòng quay lại sau — chúng tôi sẽ sớm có đề thi cho bạn!
                        </p>
                      </div>

                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                        <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                        Đang cập nhật đề thi...
                      </div>
                    </motion.div>
                  )}

                  {/* Exam cards */}
                  {!examsLoading && !examsError && examsList.map((exam) => (
                    <Card
                      key={exam.id}
                      className="border-border hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleStartExam(exam)}
                    >
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <FileText size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-foreground">{exam.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{cleanDescription(exam.description)}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration}</span>
                          </div>
                        </div>
                        <Button size="sm" className="gradient-primary text-primary-foreground shrink-0">
                          Bắt đầu luyện
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Confirmation Dialog ─── */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bắt đầu làm bài?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 mt-2">
                {selectedExam && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <FileText size={18} className="text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{selectedExam.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Clock size={12} /> {selectedExam.duration}</span>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Bạn đang bắt đầu làm bài ở chế độ <strong>Luyện tập</strong>. Ở chế độ này, bạn có thể tạm dừng thời gian làm bài, tua audio và xem giải thích chi tiết sau khi nộp bài.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Quay lại</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={confirmStart}>
              🚀 Luyện tập ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quiz;
