// src/features/vocabulary/components/VocabularyList.tsx
import type { SavedVocabulary } from "../types";
import VocabularyCard from "./VocabularyCard";
import VocabularyEmptyState from "./VocabularyEmptyState";

interface Props {
  items: SavedVocabulary[];
  onDelete?: (id: string) => void;
}

const VocabularyList = ({ items, onDelete }: Props) => {
  if (items.length === 0) return <VocabularyEmptyState />;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <VocabularyCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default VocabularyList;
