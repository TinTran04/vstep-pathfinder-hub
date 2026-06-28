import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ExitConfirmDialog } from "./ExitConfirmDialog";
import { QuestionNavigationGrid } from "./QuestionNavigationGrid";
import { X } from "lucide-react";

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

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
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
  attemptId,
}) => {
  const [showExitDialog, setShowExitDialog] = useState(false);

  const handleExitClick = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const handleExitConfirm = useCallback(async () => {
    setShowExitDialog(false);
    onExit();
  }, [onExit]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - Professional Navy Background */}
      <div className="bg-blue-900 text-white px-6 py-4 border-b-4 border-blue-950 shadow-lg">
        <div className="flex items-center justify-between">
          {/* Skill Name - Left */}
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{skillName}</h1>
          </div>

          {/* Large Timer - Center */}
          <div className="flex-1 text-center">
            <div className="text-4xl font-bold font-mono tracking-wider">
              {formatTime(remainingSeconds)}
            </div>
          </div>

          {/* Exit Button - Right */}
          <div className="flex-1 text-right">
            <Button
              onClick={handleExitClick}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="w-4 h-4 mr-1" />
              Thoát
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area (70%) */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
          {children}
        </div>

        {/* Question Navigation Sidebar (30%) */}
        <div className="w-1/3 bg-gray-50 border-l-2 border-gray-300 p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Danh sách câu hỏi
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {answeredCount}/{questionCount} câu
            </p>
          </div>

          <QuestionNavigationGrid
            questionCount={questionCount}
            currentQuestion={currentQuestion}
            questionStatuses={questionStatuses}
            onQuestionSelect={onQuestionSelect}
          />
        </div>
      </div>

      {/* Footer - Next/Submit Button */}
      <div className="bg-gray-100 border-t-2 border-gray-300 px-6 py-4 flex justify-end">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-8"
        >
          {isLastSkill ? "Nộp bài" : "Tiếp theo"}
        </Button>
      </div>

      {/* Exit Confirmation Dialog */}
      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={handleExitConfirm}
        attemptId={attemptId}
      />
    </div>
  );
};
