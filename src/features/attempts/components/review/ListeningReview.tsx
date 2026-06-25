import { CheckCircle2, XCircle, Volume2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { SectionReviewResponse } from "../../types";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";

interface Props {
  sections: SectionReviewResponse[];
  status?: string;
}

const ListeningReview = ({ sections, status }: Props) => {
  const [playingSection, setPlayingSection] = useState<number | null>(null);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const score = sections.reduce((sum, s) => sum + s.questions.filter(q => q.isCorrectAnswer || q.isCorrect).length, 0);
  
  const isCompleted = status !== "in_progress" && status !== "started";

  const handlePlayAudio = (sectionId: number) => {
    setPlayingSection(sectionId);
    setTimeout(() => setPlayingSection(null), 3000); // Mock playing state, real implementation would use Audio object
  };

  return (
    <VocabularyContextMenu source="review">
      <div className="space-y-6">
        {/* Score summary */}
        {isCompleted ? (
          <div className="p-4 bg-muted/50 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Kết quả Listening</p>
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

        {/* Per-part review */}
        {sections.map((section, sectionIdx) => {
          return (
            <div key={section.sectionId} className="space-y-3">
              {/* Part header with audio replay */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">{section.instruction}</p>
                </div>
                {section.audioUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handlePlayAudio(section.sectionId)}
                    disabled={playingSection !== null}
                  >
                    {playingSection === section.sectionId ? (
                      <>
                        <Volume2 size={14} className="animate-pulse text-primary" />
                        Đang phát...
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        Nghe lại
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Questions */}
              <div className="space-y-2">
                {section.questions.map((q, qIdx) => {
                  const isCorrect = Boolean(q.isCorrectAnswer || q.isCorrect);
                  const isSkipped = !q.userAnswer;
                  const hasExplanation = !!q.explanation;

                  return (
                    <div
                      key={q.questionId}
                      className={`p-3 rounded-xl border ${
                        !isCompleted
                          ? "border-border bg-card"
                          : isSkipped
                          ? "border-border bg-muted/30"
                          : isCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          {!isCompleted ? (
                            <span className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground font-medium">{q.displayOrder}</span>
                          ) : isSkipped ? (
                            <span className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">–</span>
                          ) : isCorrect ? (
                            <CheckCircle2 size={18} className="text-emerald-600" />
                          ) : (
                            <XCircle size={18} className="text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground mb-1">
                            <span className="text-primary mr-1">Câu {q.displayOrder}.</span>
                            {q.questionText}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {q.options.map((opt) => {
                              const isUserSelected = q.userAnswer === opt.content;
                              const isActuallyCorrect = opt.isCorrect;
                              
                              let optClass = "bg-muted text-muted-foreground";
                              
                              if (isUserSelected) {
                                optClass = "bg-primary/10 text-primary border border-primary/30";
                              }
                              
                              if (isCompleted) {
                                if (isActuallyCorrect) {
                                  optClass = "bg-emerald-100 text-emerald-700 font-medium border border-emerald-300";
                                } else if (isUserSelected && !isCorrect) {
                                  optClass = "bg-red-100 text-red-700 line-through border border-red-300";
                                } else {
                                  optClass = "bg-muted text-muted-foreground";
                                }
                              }
                              
                              return (
                                <span
                                  key={opt.optionId}
                                  className={`px-2 py-0.5 rounded text-xs ${optClass}`}
                                >
                                  {opt.label}. {opt.content}
                                </span>
                              );
                            })}
                          </div>
                          {!isCompleted ? (
                            <p className="text-xs text-muted-foreground mt-1.5">Trạng thái: {isSkipped ? "Chưa chọn đáp án" : "Đã chọn đáp án"}</p>
                          ) : (
                            <>
                              {!isCorrect && !isSkipped && q.correctAnswer && (
                                <p className="text-xs text-emerald-700 mt-1.5">
                                  ✓ Đáp án đúng: <strong>{q.correctAnswer}</strong>
                                </p>
                              )}
                              {isSkipped && (
                                <p className="text-xs text-muted-foreground mt-1">Chưa trả lời</p>
                              )}
                            </>
                          )}

                          {isCompleted && hasExplanation && (
                            <div className="mt-2.5 p-2 bg-background/50 border border-border rounded-lg text-xs">
                              <p className="font-semibold text-foreground mb-0.5">💡 Giải thích tiếng Việt:</p>
                              <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </VocabularyContextMenu>
  );
};

export default ListeningReview;
