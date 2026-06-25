import { useState } from "react";
import { Play, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SpeakingReviewResponse } from "../../types";
import { normalizeSpeakingFeedback } from "../../utils/feedback-parser";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";

interface Props {
  review: SpeakingReviewResponse;
}

const SpeakingReview = ({ review }: Props) => {
  const [playing, setPlaying] = useState<boolean>(false);
  const [playbackError, setPlaybackError] = useState<boolean>(false);

  const activeFb = normalizeSpeakingFeedback(review.feedbackJson, review.score);
  const hasRecording = Boolean(review.audioUrl);

  const handlePlayback = () => {
    if (playing || !hasRecording) return;
    const audio = new Audio(review.audioUrl);
    
    audio.onerror = () => {
      setPlaybackError(true);
      setPlaying(false);
    };

    setPlaying(true);
    audio.play().then(() => {
      audio.onended = () => setPlaying(false);
    }).catch((e) => {
      console.warn("Audio playback failed:", e);
      setPlaybackError(true);
      setPlaying(false);
    });
  };

  return (
    <div className="space-y-4">
      {/* Split: transcript + feedback */}
      <div className="flex gap-4 h-[460px]">
        {/* Left: recording + transcript */}
        <div className="flex-1 border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-foreground">Bản ghi âm của bạn</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {activeFb?.transcript ? (
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">💬 Transcript do AI nhận dạng</p>
                  <VocabularyContextMenu source="speaking">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{activeFb.transcript}</p>
                  </VocabularyContextMenu>
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs text-muted-foreground">Không có transcript cho phần thi này.</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Recording playback */}
          <div className="px-4 py-3 border-t border-border bg-card">
            {hasRecording ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium">✅ Đã ghi âm xong</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePlayback}
                    disabled={playing || playbackError}
                    className="gap-1.5"
                  >
                    <Play size={12} />
                    {playing ? "Đang phát..." : "Nghe lại"}
                  </Button>
                </div>
                {playbackError && (
                  <div className="bg-destructive/10 text-destructive text-xs p-2 rounded border border-destructive/20 mt-1">
                    ⚠️ <strong>Không thể phát lại bản ghi âm này.</strong> Audio URL có thể đã hết hạn hoặc không truy cập được.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">❌ Không tìm thấy bản ghi âm</p>
            )}
          </div>
        </div>

        {/* Right: AI feedback */}
        <div className="w-[350px] shrink-0 border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-foreground">🤖 Đánh giá AI</span>
          </div>
          <ScrollArea className="flex-1">
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
                      { label: "Fluency & Ideas", key: "fluencyIdeaDevelopment", value: activeFb.fluencyIdeaDevelopment ?? activeFb.fluency },
                      { label: "Pronunciation", key: "pronunciation", value: activeFb.pronunciation },
                      { label: "Vocabulary", key: "vocabulary", value: activeFb.vocabulary },
                      { label: "Grammar", key: "grammar", value: activeFb.grammar },
                      { label: "Content & Coherence", key: "contentCoherence", value: activeFb.contentCoherence ?? activeFb.topicDevelopment ?? activeFb.relevance },
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

                  {activeFb.timestampFeedback && activeFb.timestampFeedback.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">⏱ Phân tích chi tiết</p>
                      <div className="space-y-2">
                        {activeFb.timestampFeedback.map((fb, i) => (
                          <div key={i} className="bg-muted/30 rounded p-2 border border-border">
                            <Badge variant="outline" className="text-[10px] mb-1">
                              {fb.startTime || fb.timestamp} {fb.endTime ? `- ${fb.endTime}` : ""}
                            </Badge>
                            <p className="text-xs font-medium text-foreground">{fb.issue || fb.feedback}</p>
                            {fb.suggestion && (
                              <p className="text-xs text-emerald-600 mt-1">💡 {fb.suggestion}</p>
                            )}
                          </div>
                        ))}
                      </div>
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

                  {activeFb.betterAnswer && (
                    <div className="bg-card rounded-lg p-3 border border-border mt-2">
                      <p className="text-xs font-semibold text-foreground mb-1">✨ Câu trả lời mẫu</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{activeFb.betterAnswer}</p>
                    </div>
                  )}
                </>
              ) : review.status === "processing" ? (
                <div className="text-center py-8 space-y-2">
                  <Loader2 size={32} className="mx-auto text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Đang chờ AI phân tích bài nói...</p>
                </div>
              ) : (
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <span className="text-2xl">🎙️</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Không có đánh giá chi tiết cho phần thi này.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default SpeakingReview;
