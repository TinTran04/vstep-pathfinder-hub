import React, { useMemo } from "react";

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
  const groupedQuestions = useMemo(() => {
    if (questionCount === 40) {
      return [
        { label: "Passage 1", start: 1, end: 10 },
        { label: "Passage 2", start: 11, end: 20 },
        { label: "Passage 3", start: 21, end: 30 },
        { label: "Passage 4", start: 31, end: 40 },
      ];
    }
    if (questionCount === 35) {
      return [
        { label: "Part 1", start: 1, end: 8 },
        { label: "Part 2", start: 9, end: 20 },
        { label: "Part 3", start: 21, end: 35 },
      ];
    }
    if (questionCount === 2) {
      return [
        { label: "Task 1", start: 1, end: 1 },
        { label: "Task 2", start: 2, end: 2 },
      ];
    }
    if (questionCount === 3) {
      return [
        { label: "Part 1", start: 1, end: 1 },
        { label: "Part 2", start: 2, end: 2 },
        { label: "Part 3", start: 3, end: 3 },
      ];
    }
    return [{ label: "Câu hỏi", start: 1, end: questionCount }];
  }, [questionCount]);

  return (
    <div className="space-y-5">
      {groupedQuestions.map(({ label, start, end }) => (
        <section key={label} aria-label={label}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground">{label}</h3>
            <span className="text-[10px] text-muted-foreground">{start}-{end}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: end - start + 1 }, (_, offset) => start + offset).map(questionNumber => {
              const status = questionStatuses[questionNumber] || "unanswered";
              const isCurrent = currentQuestion === questionNumber;
              const isAnswered = status === "answered";
              const isReviewing = status === "reviewing";

              return (
                <button
                  key={questionNumber}
                  type="button"
                  onClick={() => onQuestionSelect?.(questionNumber)}
                  aria-label={`Câu ${questionNumber}: ${isAnswered ? "đã làm" : isReviewing ? "đánh dấu xem lại" : "chưa làm"}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`relative flex aspect-square min-h-9 w-full items-center justify-center rounded-md border text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isCurrent
                      ? "border-primary bg-background text-primary ring-2 ring-primary/20"
                      : isAnswered
                        ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                        : isReviewing
                          ? "border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "border-border bg-muted/60 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  }`}
                >
                  {questionNumber}
                  {isAnswered && !isCurrent && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary-foreground/90" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
