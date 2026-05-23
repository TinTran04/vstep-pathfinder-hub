// src/features/vocabulary/components/VocabularyCard.tsx
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VocabularyAudioButton from "./VocabularyAudioButton";
import type { SavedVocabulary } from "../types";

interface Props {
  item: SavedVocabulary;
  onDelete?: (id: string) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
  review: "Review",
  writing_sample: "Bài mẫu",
  unknown: "Khác",
};

const SOURCE_COLORS: Record<string, string> = {
  listening: "bg-blue-50 text-blue-700 border-blue-200",
  reading: "bg-emerald-50 text-emerald-700 border-emerald-200",
  writing: "bg-amber-50 text-amber-700 border-amber-200",
  speaking: "bg-purple-50 text-purple-700 border-purple-200",
  review: "bg-indigo-50 text-indigo-700 border-indigo-200",
  writing_sample: "bg-rose-50 text-rose-700 border-rose-200",
  unknown: "bg-muted text-muted-foreground border-border",
};

const VocabularyCard = ({ item, onDelete }: Props) => {
  return (
    <Card className="border-border hover:shadow-md transition-shadow group">
      <CardContent className="p-4 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-lg font-bold text-foreground">{item.word}</span>
            {item.phonetic && (
              <span className="text-xs text-muted-foreground font-mono">{item.phonetic}</span>
            )}
            <VocabularyAudioButton word={item.word} audioUrl={item.audioUrl} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 ${SOURCE_COLORS[item.source] ?? SOURCE_COLORS.unknown}`}
            >
              {SOURCE_LABELS[item.source] ?? "Khác"}
            </Badge>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa từ"
              >
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        </div>

        {/* Part of speech */}
        {item.partOfSpeech && (
          <span className="text-xs italic text-muted-foreground">{item.partOfSpeech}</span>
        )}

        {/* Meaning */}
        <p className="text-sm text-foreground font-medium">{item.meaningVi}</p>

        {/* Example */}
        {item.example && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
            {item.example}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default VocabularyCard;
