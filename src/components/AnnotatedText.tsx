import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface TextError {
  start: number;
  end: number;
  original: string;
  suggestion: string;
  explanation: string;
  type: "grammar" | "vocabulary" | "spelling" | "coherence";
}

interface AnnotatedTextProps {
  text: string;
  errors: TextError[];
}

const typeLabels: Record<TextError["type"], string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  spelling: "Chính tả",
  coherence: "Mạch lạc",
};

const typeColors: Record<TextError["type"], string> = {
  grammar: "bg-yellow-200/80 dark:bg-yellow-500/30",
  vocabulary: "bg-orange-200/80 dark:bg-orange-500/30",
  spelling: "bg-red-200/80 dark:bg-red-500/30",
  coherence: "bg-blue-200/80 dark:bg-blue-500/30",
};

const AnnotatedText = ({ text, errors }: AnnotatedTextProps) => {
  const [activeError, setActiveError] = useState<number | null>(null);

  // Sort errors by start position
  const sorted = [...errors].sort((a, b) => a.start - b.start);

  // Build segments
  const segments: { text: string; error?: TextError; index?: number }[] = [];
  let cursor = 0;

  sorted.forEach((err, i) => {
    if (err.start > cursor) {
      segments.push({ text: text.slice(cursor, err.start) });
    }
    segments.push({ text: text.slice(err.start, err.end), error: err, index: i });
    cursor = err.end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {(["grammar", "vocabulary", "spelling", "coherence"] as const).map(type => (
            <span key={type} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${typeColors[type]}`} />
              {typeLabels[type]}
            </span>
          ))}
        </div>

        {/* Annotated text */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {segments.map((seg, i) => {
            if (!seg.error) {
              return <span key={i}>{seg.text}</span>;
            }
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <span
                    className={`${typeColors[seg.error.type]} cursor-pointer rounded-sm px-0.5 underline decoration-wavy decoration-1 underline-offset-4 transition-all hover:brightness-90`}
                    onClick={() => setActiveError(activeError === seg.index! ? null : seg.index!)}
                  >
                    {seg.text}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-destructive">❌ {seg.error.original}</p>
                  <p className="text-xs font-semibold text-emerald-600">✅ {seg.error.suggestion}</p>
                  <p className="text-xs text-muted-foreground">{seg.error.explanation}</p>
                  <span className="inline-block text-[10px] bg-muted px-1.5 py-0.5 rounded">{typeLabels[seg.error.type]}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Error summary */}
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs font-semibold text-foreground mb-1">
            📊 Tổng lỗi: {errors.length} ({errors.filter(e => e.type === "grammar").length} ngữ pháp, {errors.filter(e => e.type === "vocabulary").length} từ vựng, {errors.filter(e => e.type === "spelling").length} chính tả, {errors.filter(e => e.type === "coherence").length} mạch lạc)
          </p>
          <p className="text-xs text-muted-foreground">Di chuột vào phần bôi màu để xem gợi ý sửa lỗi</p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AnnotatedText;
