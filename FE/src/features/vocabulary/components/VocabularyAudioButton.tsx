// src/features/vocabulary/components/VocabularyAudioButton.tsx
import { useState, useCallback } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  word: string;
  audioUrl?: string;
}

const VocabularyAudioButton = ({ word, audioUrl }: Props) => {
  const [playing, setPlaying] = useState(false);
  const supported = "speechSynthesis" in window;

  const handlePlay = useCallback(() => {
    if (playing) return;

    if (audioUrl) {
      setPlaying(true);
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      audio.play().catch(() => setPlaying(false));
      return;
    }

    if (!supported) return;

    setPlaying(true);
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = "en-US";
    utter.rate = 0.9;
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utter);
  }, [playing, audioUrl, word, supported]);

  if (!audioUrl && !supported) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        title="Trình duyệt không hỗ trợ phát âm"
        className="h-7 w-7 text-muted-foreground"
      >
        <VolumeX size={14} />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePlay}
      disabled={playing}
      title="Nghe phát âm"
      className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
    >
      {playing ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Volume2 size={14} />
      )}
    </Button>
  );
};

export default VocabularyAudioButton;
