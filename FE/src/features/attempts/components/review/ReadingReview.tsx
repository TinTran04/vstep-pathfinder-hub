import { useState } from "react";
import { CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { passages } from "@/features/quiz/reading/mocks/reading.mock";
import type { SkillAttempt } from "../../types";
import { getReadingExplanation } from "@/features/quiz/mocks/explanations.mock";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";

interface Props {
  attempt: SkillAttempt;
}

const ReadingReview = ({ attempt }: Props) => {
  const { answers = {}, score = 0, totalQuestions = 0 } = attempt;
  const [activePassage, setActivePassage] = useState(0);

  const passage = passages[activePassage];

  return (
    <div className="space-y-4">
      {/* Score */}
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

      {/* Passage tabs */}
      <div className="flex gap-1 flex-wrap">
        {passages.map((p, i) => (
          <button
            key={i}
            onClick={() => setActivePassage(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === activePassage
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
                <h3 className="font-bold text-foreground text-sm">{passage.title}</h3>
              </div>
              <VocabularyContextMenu source="review">
                <div>
                  {passage.content.split("\n\n").map((para, i) => (
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
              {passage.questions.map((q, qIdx) => {
                const gIdx =
                  passages.slice(0, activePassage).reduce((s, p) => s + p.questions.length, 0) + qIdx + 1;
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correct;
                const isSkipped = userAnswer === undefined;

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border text-xs ${
                      isSkipped
                        ? "border-border bg-muted/30"
                        : isCorrect
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {isSkipped ? (
                        <span className="text-muted-foreground shrink-0">–</span>
                      ) : isCorrect ? (
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                      )}
                      <p className="font-medium text-foreground">
                        <span className="text-primary mr-1">Câu {gIdx}.</span>
                        {q.question}
                      </p>
                    </div>
                    <div className="space-y-1 pl-5">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`px-2 py-1 rounded ${
                            i === q.correct
                              ? "bg-emerald-100 text-emerald-700 font-medium"
                              : i === userAnswer && !isCorrect
                              ? "bg-red-100 text-red-700 line-through"
                              : "text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>

                    <div className="mt-2.5 p-2 bg-background/50 border border-border rounded-lg">
                      <p className="font-semibold text-foreground mb-0.5">💡 Giải thích tiếng Việt:</p>
                      <p className="text-muted-foreground leading-relaxed">{getReadingExplanation(q.id)}</p>
                    </div>
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
