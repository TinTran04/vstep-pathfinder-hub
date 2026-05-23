import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { speakingService } from "@/features/quiz/speaking/services/speaking.service";
import { parts } from "@/features/quiz/speaking/mocks/speaking.mock";
import type { SkillAttempt, SpeakingFeedbackResult } from "../../types";
import { getSpeakingTranscript } from "@/features/quiz/mocks/explanations.mock";
import VocabularyContextMenu from "@/features/vocabulary/components/VocabularyContextMenu";

interface Props {
  attempt: SkillAttempt;
}

const SpeakingReview = ({ attempt }: Props) => {
  const { recordings = {} } = attempt;
  const [feedback, setFeedback] = useState<Record<number, SpeakingFeedbackResult>>(
    attempt.speakingFeedback ?? {}
  );
  const [loading, setLoading] = useState(false);
  const [feedbackGenerated, setFeedbackGenerated] = useState(
    Object.keys(attempt.speakingFeedback ?? {}).length > 0
  );
  const [activePart, setActivePart] = useState(0);
  const [playingPart, setPlayingPart] = useState<number | null>(null);
  const [playbackErrors, setPlaybackErrors] = useState<Record<number, boolean>>({});

  const handleGenerateFeedback = async () => {
    setLoading(true);
    try {
      const result = await speakingService.generateSpeakingFeedback(recordings);
      setFeedback(result as Record<number, SpeakingFeedbackResult>);
      setFeedbackGenerated(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayback = (partId: number, url: string) => {
    if (playingPart !== null) return;
    const audio = new Audio(url);
    
    audio.onerror = () => {
      setPlaybackErrors(prev => ({ ...prev, [partId]: true }));
      setPlayingPart(null);
    };

    setPlayingPart(partId);
    audio.play().then(() => {
      audio.onended = () => setPlayingPart(null);
    }).catch((e) => {
      console.warn("Audio playback failed:", e);
      setPlaybackErrors(prev => ({ ...prev, [partId]: true }));
      setPlayingPart(null);
    });
  };

  const part = parts[activePart];
  const activeFb = feedback[part.id];
  const hasRecording = Boolean(recordings[part.id]);

  return (
    <div className="space-y-4">
      {/* Part tabs + AI button */}
      <div className="flex items-center gap-2 flex-wrap">
        {parts.map((p, i) => (
          <button
            key={i}
            onClick={() => setActivePart(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === activePart
                ? "gradient-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Part {i + 1}
            {hasRecording && (
              <span className="ml-1 text-emerald-500">●</span>
            )}
          </button>
        ))}
        {!feedbackGenerated && (
          <Button
            size="sm"
            className="ml-auto gradient-primary text-primary-foreground"
            onClick={handleGenerateFeedback}
            disabled={loading || Object.keys(recordings).length === 0}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin mr-1" /> Đang phân tích...</>
            ) : (
              "🤖 Xem đánh giá AI"
            )}
          </Button>
        )}
      </div>

      {/* Split: prompt + feedback */}
      <div className="flex gap-4 h-[460px]">
        {/* Left: prompt + recording */}
        <div className="flex-1 border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-foreground">{part.title}</span>
            <Badge variant="outline" className="ml-2 text-xs">⏱ {part.duration}</Badge>
          </div>
          <ScrollArea className="h-[calc(100%-80px)]">
            <div className="p-4 space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Đề bài</p>
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{part.prompt}</p>
              </div>

              {/* Sample model answer */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-2">📝 Bài nói mẫu tham khảo</p>
                <VocabularyContextMenu source="review">
                  <p className="text-xs text-foreground whitespace-pre-line leading-relaxed italic">{getSpeakingTranscript(part.id)}</p>
                </VocabularyContextMenu>
              </div>

              {/* User transcript if generated */}
              {activeFb?.transcript && (
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">💬 Bản ghi âm của bạn (Transcript)</p>
                  <VocabularyContextMenu source="speaking">
                    <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{activeFb.transcript}</p>
                  </VocabularyContextMenu>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Hướng dẫn</p>
                <ul className="space-y-1">
                  {part.tips.map((t, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-primary">•</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollArea>
          {/* Recording playback */}
          <div className="px-4 py-3 border-t border-border bg-card">
            {hasRecording ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium">✅ Đã ghi âm Part {part.id}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlayback(part.id, recordings[part.id]!)}
                    disabled={playingPart !== null || playbackErrors[part.id]}
                    className="gap-1.5"
                  >
                    <Play size={12} />
                    {playingPart === part.id ? "Đang phát..." : "Nghe lại"}
                  </Button>
                </div>
                {playbackErrors[part.id] && (
                  <div className="bg-destructive/10 text-destructive text-xs p-2 rounded border border-destructive/20 mt-1">
                    ⚠️ <strong>Không thể phát lại bản ghi âm này.</strong> Nếu bạn đã tải lại trang (F5), các Blob URL tạm thời trong bộ nhớ của trình duyệt đã bị thu hồi. Tính năng tải tệp tin lên Cloud Storage sẽ được xử lý khi tích hợp API Backend.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">❌ Chưa ghi âm part này</p>
            )}
          </div>
        </div>

        {/* Right: AI feedback */}
        <div className="w-72 shrink-0 border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-foreground">🤖 Đánh giá AI – Part {part.id}</span>
          </div>
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="p-4 space-y-3">
              {activeFb ? (
                <>
                  {[
                    { label: "🎤 Phát âm", value: activeFb.pronunciation },
                    { label: "💬 Trôi chảy", value: activeFb.fluency },
                    { label: "📝 Ngữ pháp", value: activeFb.grammar },
                    { label: "📚 Từ vựng", value: activeFb.vocabulary },
                  ].map((item) => (
                    <div key={item.label} className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-1">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">💡 Cải thiện</p>
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
                <div className="text-center py-10 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <span className="text-2xl">🎙️</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {feedbackGenerated
                      ? "Không có feedback cho part này"
                      : "Nhấn \"Xem đánh giá AI\" để phân tích bài nói"}
                  </p>
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
