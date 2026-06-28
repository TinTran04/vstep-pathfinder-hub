import { FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import AnnotatedText from "@/features/quiz/writing/components/AnnotatedText";
import type { WritingReviewResponse } from "../../types";
import { normalizeWritingFeedback } from "../../utils/feedback-parser";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";

interface Props {
  review: WritingReviewResponse;
}

const WritingReview = ({ review }: Props) => {
  const text = review.essayText || "";
  const wordCount = countEnglishWords(text);
  
  const activeFb = normalizeWritingFeedback(review.feedbackJson, review.score);

  return (
    <VocabularyContextMenu source="review">
      <div className="space-y-4">
        {/* Prompt */}
        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Đề bài</p>
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{review.prompt}</p>
        </div>

        {/* Split: writing + feedback */}
        <div className="flex gap-4 h-[420px]">
          {/* Left: writing text */}
          <div className="flex-1 border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText size={12} className="text-primary" /> Bài viết của bạn
              </span>
              <Badge variant="default" className="bg-emerald-100 text-emerald-700 text-xs">
                {wordCount} từ
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="p-4">
                {activeFb && activeFb.errors && activeFb.errors.length > 0 ? (
                  <AnnotatedText text={text} errors={activeFb.errors} />
                ) : text ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Chưa viết bài</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: feedback */}
          <div className="w-[350px] shrink-0 border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-xs font-semibold text-foreground">🤖 Đánh giá AI</span>
            </div>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="p-4 space-y-4">
                {activeFb ? (
                  <>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Điểm tổng</p>
                      <p className="text-3xl font-bold text-primary">{activeFb.overallScore ?? activeFb.score}</p>
                    </div>

                    {activeFb.summary && (
                      <div className="bg-card rounded-lg p-3 border border-border">
                        <p className="text-xs font-semibold text-foreground mb-1">📝 Tổng quan</p>
                        <p className="text-xs text-muted-foreground">{activeFb.summary}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Task Fulfillment", key: "taskFulfillment", value: activeFb.taskFulfillment ?? activeFb.taskAchievement ?? activeFb.taskResponse },
                        { label: "Grammar", key: "grammar", value: activeFb.grammar },
                        { label: "Vocabulary", key: "vocabulary", value: activeFb.lexical ?? activeFb.vocabulary },
                        { label: "Organization", key: "organization", value: activeFb.coherence ?? activeFb.organization },
                      ].map((item) => (
                        <div key={item.label} className="bg-muted/30 rounded-lg p-2 border border-border">
                          <p className="text-[10px] font-semibold text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-bold text-foreground">{item.value ?? "-"}</p>
                          {activeFb.criteriaExplanations?.[item.key] && (
                            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{activeFb.criteriaExplanations[item.key]}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {activeFb.scoreExplanation && (
                      <div className="bg-card rounded-lg p-3 border border-border">
                        <p className="text-xs font-semibold text-foreground mb-1">📉 Giải thích điểm</p>
                        <p className="text-xs text-muted-foreground">{activeFb.scoreExplanation}</p>
                      </div>
                    )}

                    {activeFb.strengths && activeFb.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">⭐ Điểm mạnh</p>
                        <ul className="space-y-1.5">
                          {activeFb.strengths.map((strength, i) => (
                            <li key={i} className="text-xs text-emerald-600 flex gap-1.5">
                              <span className="shrink-0">•</span>{strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeFb.weaknesses && activeFb.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">⚠️ Điểm yếu</p>
                        <ul className="space-y-1.5">
                          {activeFb.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-xs text-red-500 flex gap-1.5">
                              <span className="shrink-0">•</span>{weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeFb.tips && activeFb.tips.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">💡 Gợi ý cải thiện</p>
                        <ul className="space-y-1.5">
                          {activeFb.tips.map((tip, i) => (
                            <li key={i} className="text-xs text-primary flex gap-1.5">
                              <span className="shrink-0">•</span>{tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeFb.improvedVersion && (
                      <div className="bg-card rounded-lg p-3 border border-border mt-2">
                        <p className="text-xs font-semibold text-foreground mb-1">✨ Bài viết cải thiện</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{activeFb.improvedVersion}</p>
                      </div>
                    )}
                  </>
                ) : review.status === "processing" ? (
                  <div className="text-center py-8 space-y-2">
                    <Loader2 size={32} className="mx-auto text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Đang chờ AI chấm bài...</p>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Không có đánh giá chi tiết cho bài này.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </VocabularyContextMenu>
  );
};

function countEnglishWords(value: string): number {
  return value.match(/\b[A-Za-z][A-Za-z']+\b/g)?.length ?? 0;
}

export default WritingReview;
