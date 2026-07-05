import { Badge } from "@/components/ui/badge";
import type { BlogPostStatus } from "@/features/blog/types";

interface BlogStatusBadgeProps {
  status: BlogPostStatus;
}

const statusStyles: Record<BlogPostStatus, string> = {
  Draft: "border-amber-200 bg-amber-50 text-amber-700",
  Published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Archived: "border-border bg-muted text-muted-foreground",
};

const statusLabels: Record<BlogPostStatus, string> = {
  Draft: "Bản nháp",
  Published: "Đã xuất bản",
  Archived: "Lưu trữ",
};

const BlogStatusBadge = ({ status }: BlogStatusBadgeProps) => (
  <Badge variant="outline" className={statusStyles[status]}>{statusLabels[status]}</Badge>
);

export default BlogStatusBadge;
