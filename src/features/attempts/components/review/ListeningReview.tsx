import { CheckCircle2, XCircle, Volume2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { listeningParts } from "@/features/quiz/listening/mocks/listening.mock";
import type { SkillAttempt } from "../../types";
import { getListeningExplanation } from "@/features/quiz/mocks/explanations.mock";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";

interface Props {
  attempt: SkillAttempt;
}

const ListeningReview = ({ attempt }: Props) => {
  const { answers = {}, score = 0, totalQuestions = 0 } = attempt;
  const [playingPart, setPlayingPart] = useState<number | null>(null);

  // Simulate audio playback
  const handlePlayAudio = (partIdx: number) => {
    setPlayingPart(partIdx);
    setTimeout(() => setPlayingPart(null), 3000);
  };

  const _allQuestions = listeningParts.flatMap((p) => p.questions);

  return (
    <VocabularyContextMenu source="review">
      <div className="space-y-6">
        {/* Score summary */}
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

        {/* Per-part review */}
        {listeningParts.map((part, partIdx) => {
          const partOffset = listeningParts
            .slice(0, partIdx)
            .reduce((s, p) => s + p.questions.length, 0);

          return (
            <div key={partIdx} className="space-y-3">
              {/* Part header with audio replay */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{part.title}</h3>
                  <p className="text-xs text-muted-foreground">{part.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handlePlayAudio(partIdx)}
                  disabled={playingPart !== null}
                >
                  {playingPart === partIdx ? (
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
              </div>

              {/* Questions */}
              <div className="space-y-2">
                {part.questions.map((q, qIdx) => {
                  const globalIdx = partOffset + qIdx + 1;
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correct;
                  const isSkipped = userAnswer === undefined;

                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border ${
                        isSkipped
                          ? "border-border bg-muted/30"
                          : isCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          {isSkipped ? (
                            <span className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">–</span>
                          ) : isCorrect ? (
                            <CheckCircle2 size={18} className="text-emerald-600" />
                          ) : (
                            <XCircle size={18} className="text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground mb-1">
                            <span className="text-primary mr-1">Câu {globalIdx}.</span>
                            {q.question}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {q.options.map((opt, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-xs ${
                                  i === q.correct
                                    ? "bg-emerald-100 text-emerald-700 font-medium border border-emerald-300"
                                    : i === userAnswer && !isCorrect
                                    ? "bg-red-100 text-red-700 line-through border border-red-300"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {String.fromCharCode(65 + i)}. {opt}
                              </span>
                            ))}
                          </div>
                          {!isCorrect && !isSkipped && (
                            <p className="text-xs text-emerald-700 mt-1.5">
                              ✓ Đáp án đúng: <strong>{q.options[q.correct]}</strong>
                            </p>
                          )}
                          {isSkipped && (
                            <p className="text-xs text-muted-foreground mt-1">Chưa trả lời</p>
                          )}

                          <div className="mt-2.5 p-2 bg-background/50 border border-border rounded-lg text-xs">
                            <p className="font-semibold text-foreground mb-0.5">💡 Giải thích tiếng Việt:</p>
                            <p className="text-muted-foreground leading-relaxed">{getListeningExplanation(q.id)}</p>
                          </div>
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
