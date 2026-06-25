import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface QuestionNavigationGridProps {
  questionCount: number;
  currentQuestion?: number;
  questionStatuses?: Record<number, "answered" | "unanswered" | "reviewing">;
  onQuestionSelect?: (questionNum: number) => void;
}

export const QuestionNavigationGrid: React.FC<QuestionNavigationGridProps> = ({
  questionCount,
  currentQuestion,
  questionStatuses = {},
  onQuestionSelect,
}) => {
  // For Reading: group by 10 (passages). For others: single grid
  const groupedQuestions = useMemo(() => {
    if (questionCount === 40) {
      // Reading - 4 passages x 10 questions
      return [
        { label: "Passage 1", start: 1, end: 10 },
        { label: "Passage 2", start: 11, end: 20 },
        { label: "Passage 3", start: 21, end: 30 },
        { label: "Passage 4", start: 31, end: 40 },
      ];
    } else if (questionCount === 35) {
      // Listening - 3 parts (8 + 12 + 15 = 35)
      return [
        { label: "Part 1", start: 1, end: 8 },
        { label: "Part 2", start: 9, end: 20 },
        { label: "Part 3", start: 21, end: 35 },
      ];
    } else if (questionCount === 2) {
      // Writing - 2 tasks
      return [{ label: "Task 1", start: 1, end: 1 }, { label: "Task 2", start: 2, end: 2 }];
    } else if (questionCount === 3) {
      // Speaking - 3 parts
      return [
        { label: "Part 1", start: 1, end: 1 },
        { label: "Part 2", start: 2, end: 2 },
        { label: "Part 3", start: 3, end: 3 },
      ];
    }
    return [{ label: "Questions", start: 1, end: questionCount }];
  }, [questionCount]);

  const renderQuestionGroup = (label: string, start: number, end: number) => {
    const questions = [];
    for (let i = start; i <= end; i++) {
      const status = questionStatuses[i] || "unanswered";
      const isAnswered = status === "answered";
      const isCurrent = currentQuestion === i;

      questions.push(
        <Button
          key={i}
          onClick={() => onQuestionSelect?.(i)}
          className={`
            w-10 h-10 p-0 text-sm font-semibold rounded-sm
            transition-all duration-150
            ${
              isCurrent
                ? "border-4 border-blue-900 bg-white text-blue-900"
                : isAnswered
                ? "bg-blue-900 text-white hover:bg-blue-800"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }
          `}
        >
          {isAnswered ? (
            <Check className="w-4 h-4" />
          ) : (
            i
          )}
        </Button>
      );
    }

    return (
      <div key={label} className="mb-4">
        {/* Section Header */}
        {questionCount >= 35 && (
          <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
            {label}
          </h4>
        )}

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-1">
          {questions}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {groupedQuestions.map(({ label, start, end }) =>
        renderQuestionGroup(label, start, end)
      )}
    </div>
  );
};
