import React, { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Grid3X3, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QuestionNavigationGrid } from "./QuestionNavigationGrid";

interface VstepMockLayoutProps {
  skillName: string;
  remainingSeconds: number;
  questionCount: number;
  answeredCount: number;
  currentQuestion?: number;
  isLastSkill?: boolean;
  onExit: () => void;
  onNext?: () => void;
  onQuestionSelect?: (questionNum: number) => void;
  children: React.ReactNode;
  questionStatuses?: Record<number, "answered" | "unanswered" | "reviewing">;
  attemptId?: string | number;
}

const skills = ["Listening", "Reading", "Writing", "Speaking"];

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const VstepMockLayout: React.FC<VstepMockLayoutProps> = ({
  skillName,
  remainingSeconds,
  questionCount,
  answeredCount,
  currentQuestion,
  isLastSkill = false,
  onExit,
  onNext,
  onQuestionSelect,
  children,
  questionStatuses = {},
}) => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const skillKey = skillName.split("/")[0].trim();
  const currentSkillIndex = Math.max(0, skills.indexOf(skillKey));
  const completionPercent = questionCount > 0 ? (answeredCount / questionCount) * 100 : 0;
  const timerUrgent = remainingSeconds <= 300;

  const statusSummary = useMemo(() => ({
    answered: Object.values(questionStatuses).filter(status => status === "answered").length,
    reviewing: Object.values(questionStatuses).filter(status => status === "reviewing").length,
  }), [questionStatuses]);

  const handleQuestionSelect = (questionNum: number) => {
    onQuestionSelect?.(questionNum);
    setNavigationOpen(false);
  };

  const navigationPanel = (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">Tiến độ bài làm</span>
          <span className="font-bold text-primary">{answeredCount}/{questionCount}</span>
        </div>
        <Progress value={completionPercent} className="h-2" />
      </div>

      <QuestionNavigationGrid
        questionCount={questionCount}
        currentQuestion={currentQuestion}
        questionStatuses={questionStatuses}
        onQuestionSelect={handleQuestionSelect}
      />

      <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-primary" />
          Đã làm ({statusSummary.answered})
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border-2 border-primary bg-background" />
          Hiện tại
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-border bg-muted" />
          Chưa làm
        </div>
        {statusSummary.reviewing > 0 && (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-amber-400" />
            Xem lại ({statusSummary.reviewing})
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh min-h-[560px] flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-20 shrink-0 border-b border-border bg-card shadow-sm">
        <div className="flex min-h-[68px] items-center gap-3 px-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary sm:flex">
              {currentSkillIndex + 1}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Thi thử VSTEP</p>
              <h1 className="truncate text-sm font-bold sm:text-base">{skillName}</h1>
            </div>
          </div>

          <div className={`flex h-11 shrink-0 items-center gap-2 rounded-lg border px-3 sm:px-4 ${
            timerUrgent
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-primary/20 bg-primary/5 text-foreground"
          }`}>
            <Clock3 size={17} className={timerUrgent ? "animate-pulse" : "text-primary"} />
            <div>
              <p className="hidden text-[9px] font-semibold uppercase text-muted-foreground sm:block">Thời gian còn lại</p>
              <p className="font-mono text-lg font-bold leading-none tabular-nums sm:text-xl">{formatTime(remainingSeconds)}</p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="hidden items-center gap-1 xl:flex" aria-label="Tiến trình kỹ năng">
              {skills.map((skill, index) => (
                <div key={skill} className="flex items-center gap-1">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                    index < currentSkillIndex
                      ? "bg-accent text-accent-foreground"
                      : index === currentSkillIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {index < currentSkillIndex ? <CheckCircle2 size={14} /> : index + 1}
                  </span>
                  {index < skills.length - 1 && <span className="h-px w-3 bg-border" />}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setNavigationOpen(true)}
              aria-label="Mở danh sách câu hỏi"
            >
              <Grid3X3 size={17} />
            </Button>
            <Button
              type="button"
              onClick={onExit}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X size={17} />
              <span className="hidden sm:inline">Thoát</span>
            </Button>
          </div>
        </div>
        <Progress value={completionPercent} className="h-1 rounded-none bg-muted" />
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto bg-background p-3 sm:p-5 lg:p-6">
          {children}
        </main>

        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-border bg-card p-5 lg:block xl:w-80">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Điều hướng</p>
            <h2 className="mt-1 text-base font-bold">Danh sách câu hỏi</h2>
          </div>
          {navigationPanel}
        </aside>
      </div>

      <footer className="z-20 flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-3 py-2.5 shadow-[0_-4px_16px_hsl(var(--foreground)/0.04)] sm:px-5 lg:px-6">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
          <p className="text-sm font-bold text-foreground">{answeredCount}/{questionCount} câu</p>
        </div>
        <Button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          className="h-10 min-w-[132px] gap-2 px-5 font-semibold sm:min-w-[160px]"
        >
          {isLastSkill ? <Send size={16} /> : <ArrowRight size={16} />}
          {isLastSkill ? "Nộp bài" : "Chuyển kỹ năng"}
        </Button>
      </footer>

      <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
        <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Danh sách câu hỏi</SheetTitle>
            <SheetDescription>Chọn số câu để di chuyển nhanh trong bài thi.</SheetDescription>
          </SheetHeader>
          <div className="mt-6">{navigationPanel}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
