import { useState } from "react";
import { CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SectionReviewResponse } from "../../types";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";

interface Props {
  sections: SectionReviewResponse[];
  status?: string;
}

const ReadingReview = ({ sections, status }: Props) => {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const score = sections.reduce((sum, s) => sum + s.questions.filter(q => q.isCorrectAnswer || q.isCorrect).length, 0);
  
  const isCompleted = status !== "in_progress" && status !== "started";

  if (sections.length === 0) {
    return null;
  }

  const section = sections[activeSectionIdx];

  return (
    <div className="space-y-4">
      {/* Score */}
      {isCompleted ? (
        <div className="p-4 bg-muted/50 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Kết quả Reading</p>
            <p className="text-3xl font-bold text-foreground">
              {score}
              <span className="text-lg text-muted-foreground">/{totalQuestions}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Điểm quy đổi</p>
            <p className="text-2xl font-bold text-primary">
              {totalQuestions > 0 ? ((score / totalQuestions) * 10).toFixed(1) : "0.0"}/10
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex flex-col items-center justify-center text-center">
          <p className="font-semibold text-sm mb-1">Bài làm chưa hoàn thành</p>
          <p className="text-xs">Chưa thể xem điểm số và đáp án chi tiết.</p>
        </div>
      )}

      {/* Passage tabs */}
      <div className="flex gap-1 flex-wrap">
        {sections.map((s, i) => (
          <button
            key={s.sectionId}
            onClick={() => setActiveSectionIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === activeSectionIdx
                ? "gradient-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Bài {i + 1}
          </button>
        ))}
      </div>

      {/* Split view */}
      <div className="flex gap-4 h-[500px] border border-border rounded-2xl overflow-hidden">
        {/* Left: passage */}
        <div className="w-1/2 border-r border-border">
          <ScrollArea className="h-full">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-primary" />
                <h3 className="font-bold text-foreground text-sm">{section.title}</h3>
              </div>
              <VocabularyContextMenu source="review">
                <div>
                  {(section.passageText || "").split("\n\n").map((para, i) => (
                    <p key={i} className="text-xs text-foreground leading-relaxed mb-3">{para}</p>
                  ))}
                </div>
              </VocabularyContextMenu>
            </div>
          </ScrollArea>
        </div>

        {/* Right: questions with answers */}
        <div className="w-1/2">
          <ScrollArea className="h-full">
            <div className="p-5 space-y-3">
              {section.questions.map((q) => {
                const isCorrect = Boolean(q.isCorrectAnswer || q.isCorrect);
                const isSkipped = !q.userAnswer;
                const hasExplanation = !!q.explanation;

                return (
                  <div
                    key={q.questionId}
                    className={`p-3 rounded-xl border text-xs ${
                      !isCompleted
                        ? "border-border bg-card"
                        : isSkipped
                        ? "border-border bg-muted/30"
                        : isCorrect
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {!isCompleted ? (
                        <span className="text-[10px] font-medium bg-muted w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-0.5 text-muted-foreground border border-border">{q.displayOrder}</span>
                      ) : isSkipped ? (
                        <span className="text-muted-foreground shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-muted border border-border mt-0.5">–</span>
                      ) : isCorrect ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      )}
                      <p className="font-medium text-foreground leading-relaxed mt-0.5">
                        <span className="text-primary mr-1">Câu {q.displayOrder}.</span>
                        {q.questionText}
                      </p>
                    </div>
                    <div className="space-y-1 pl-5">
                      {q.options.map((opt) => {
                        const isUserSelected = q.userAnswer === opt.content;
                        const isActuallyCorrect = opt.isCorrect;
                        
                        let optClass = "text-muted-foreground";
                        
                        if (isUserSelected) {
                          optClass = "bg-primary/10 text-primary border border-primary/20";
                        }
                        
                        if (isCompleted) {
                          if (isActuallyCorrect) {
                            optClass = "bg-emerald-100 text-emerald-700 font-medium";
                          } else if (isUserSelected && !isCorrect) {
                            optClass = "bg-red-100 text-red-700 line-through";
                          } else {
                            optClass = "text-muted-foreground";
                          }
                        }
                        
                        return (
                          <div
                            key={opt.optionId}
                            className={`px-2 py-1 rounded ${optClass}`}
                          >
                            {opt.label}. {opt.content}
                          </div>
                        );
                      })}
                    </div>
                    
                    {!isCompleted ? (
                      <div className="mt-2 pl-7">
                        <p className="text-xs text-muted-foreground">Trạng thái: {isSkipped ? "Chưa chọn đáp án" : "Đã chọn đáp án"}</p>
                      </div>
                    ) : (
                      <>
                        {!isCorrect && !isSkipped && q.correctAnswer && (
                          <div className="mt-2 pl-7">
                            <p className="text-xs text-emerald-700">✓ Đáp án đúng: <strong>{q.correctAnswer}</strong></p>
                          </div>
                        )}
                        {isSkipped && (
                          <div className="mt-2 pl-7">
                            <p className="text-xs text-muted-foreground">Chưa trả lời</p>
                          </div>
                        )}
                        {hasExplanation && (
                          <div className="mt-2.5 p-2 bg-background/50 border border-border rounded-lg ml-7">
                            <p className="font-semibold text-foreground mb-0.5">💡 Giải thích tiếng Việt:</p>
                            <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ReadingReview;
