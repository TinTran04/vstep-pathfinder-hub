import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BlogFiltersProps {
  search: string;
  category: string;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
}

const BlogFilters = ({
  search,
  category,
  categories,
  onSearchChange,
  onCategoryChange,
  onClear,
}: BlogFiltersProps) => {
  const hasFilters = Boolean(search || category);

  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-center">
      <div className="relative min-w-0 flex-1 md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm bài viết..."
          className="h-10 pl-10"
          aria-label="Tìm bài viết"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0" aria-label="Lọc theo chuyên mục">
          <Button type="button" size="sm" variant={category === "" ? "default" : "outline"} onClick={() => onCategoryChange("")}>
            Tất cả
          </Button>
          {categories.map((item) => (
            <Button key={item} type="button" size="sm" variant={category === item ? "default" : "outline"} onClick={() => onCategoryChange(item)}>
              {item}
            </Button>
          ))}
        </div>
      )}

      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" className="gap-1.5 self-start text-muted-foreground md:self-auto" onClick={onClear}>
          <X size={15} /> Xóa lọc
        </Button>
      )}
    </div>
  );
};

export default BlogFilters;
