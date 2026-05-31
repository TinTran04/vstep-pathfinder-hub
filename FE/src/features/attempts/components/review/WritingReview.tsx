import { useState } from "react";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import AnnotatedText from "@/features/quiz/writing/components/AnnotatedText";
import { writingService, type WritingApiFeedbackItem } from "@/features/quiz/writing/services/writing.service";
import { tasks } from "@/features/quiz/writing/mocks/writing.mock";
import type { SkillAttempt, WritingFeedbackResult } from "../../types";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";

interface Props {
  attempt: SkillAttempt;
}

const WritingReview = ({ attempt }: Props) => {
  const { writings = {} } = attempt;
  const [activeTask, setActiveTask] = useState(0);
  const [feedback, setFeedback] = useState<Record<number, WritingFeedbackResult | WritingApiFeedbackItem>>(
    attempt.writingFeedback ?? {}
  );
  const [loading, setLoading] = useState(false);
  const [feedbackGenerated, setFeedbackGenerated] = useState(
    Object.keys(attempt.writingFeedback ?? {}).length > 0
  );

  const handleGenerateFeedback = async () => {
    setLoading(true);
    try {
      const result = await writingService.generateWritingFeedback(
        writings,
        attempt.writingExamIds
      );
      setFeedback(result as Record<number, WritingFeedbackResult>);
      setFeedbackGenerated(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const task = tasks[activeTask];
  const text = writings[task.id] || "";
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const activeFb = feedback[task.id];

  return (
    <VocabularyContextMenu source="review">
      <div className="space-y-4">
        {/* Task tabs */}
        <div className="flex gap-1">
          {tasks.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTask(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                i === activeTask
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.title.split(" – ")[0]}
              {feedbackGenerated && feedback[t.id] && (
                <Badge className="ml-2 text-xs bg-primary/20 text-primary border-none">
                  {(() => {
                    const fb = feedback[t.id];
                    if ('source' in fb && fb.source === "api") {
                      return fb.score !== null ? `${fb.score}/10` : "Đang xử lý...";
                    }
                    return fb.score;
                  })()}
                </Badge>
              )}
            </button>
          ))}
          {!feedbackGenerated && (
            <Button
              size="sm"
              className="ml-auto gradient-primary text-primary-foreground"
              onClick={handleGenerateFeedback}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin mr-1" /> Đang chấm...</>
              ) : (
                "🤖 Chấm điểm AI"
              )}
            </Button>
          )}
        </div>

        {/* Prompt */}
        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Đề bài</p>
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{task.prompt}</p>
        </div>

        {/* Split: writing + feedback */}
        <div className="flex gap-4 h-[420px]">
          {/* Left: writing text */}
          <div className="flex-1 border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText size={12} className="text-primary" /> Bài viết của bạn
              </span>
              <Badge variant={wordCount >= task.minWords ? "default" : "destructive"}
                className={wordCount >= task.minWords ? "bg-emerald-100 text-emerald-700 text-xs" : "text-xs"}>
                {wordCount} / {task.minWords}+ từ
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="p-4">
                {activeFb && !('source' in activeFb) && activeFb.errors && activeFb.errors.length > 0 ? (
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
          <div className="w-72 shrink-0 border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-xs font-semibold text-foreground">🤖 Đánh giá AI</span>
            </div>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="p-4 space-y-3">
                {activeFb && 'source' in activeFb && activeFb.source === "api" ? (
                  <>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Điểm tổng</p>
                      <p className="text-2xl font-bold text-primary">
                        {activeFb.score !== null ? `${activeFb.score}/10` : "Đang xử lý..."}
                      </p>
                    </div>
                    {activeFb.feedback && (
                      <div className="bg-card rounded-lg p-3 border border-border">
                        <p className="text-xs font-semibold text-foreground mb-1">📋 Nhận xét của AI</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{activeFb.feedback}</p>
                      </div>
                    )}
                  </>
                ) : activeFb ? (
                  <>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Điểm tổng</p>
                      <p className="text-2xl font-bold text-primary">{activeFb.score}</p>
                    </div>
                    {[
                      { label: "📋 Task Achievement", value: activeFb.taskAchievement },
                      { label: "🔗 Coherence", value: activeFb.coherence },
                      { label: "📚 Lexical", value: activeFb.lexical },
                      { label: "📝 Grammar", value: activeFb.grammar },
                    ].map((item) => (
                      <div key={item.label} className="bg-card rounded-lg p-3 border border-border">
                        <p className="text-xs font-semibold text-foreground mb-1">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.value}</p>
                      </div>
                    ))}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">💡 Gợi ý</p>
                      <ul className="space-y-1.5">
                        {activeFb.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                            <span className="text-primary shrink-0">•</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {feedbackGenerated
                        ? "Không có feedback cho task này"
                        : "Nhấn \"Chấm điểm AI\" để nhận đánh giá chi tiết"}
                    </p>
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

export default WritingReview;
