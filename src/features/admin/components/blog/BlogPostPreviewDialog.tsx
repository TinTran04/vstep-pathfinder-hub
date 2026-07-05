import { CalendarDays, Clock3, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MarkdownRenderer from "@/features/blog/components/MarkdownRenderer";
import type { BlogPost } from "@/features/blog/types";
import BlogStatusBadge from "./BlogStatusBadge";

interface BlogPostPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
}

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value))
  : "Chưa xuất bản";

const BlogPostPreviewDialog = ({ open, onOpenChange, post }: BlogPostPreviewDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
      <DialogHeader className="border-b border-border px-6 py-4 text-left">
        <DialogTitle>Xem trước bài viết</DialogTitle>
        <DialogDescription>Giao diện nội dung trước khi hiển thị trên Journal.</DialogDescription>
      </DialogHeader>

      {post && (
        <article>
          {post.coverImageUrl && <img src={post.coverImageUrl} alt={post.title} className="aspect-[16/7] w-full object-cover" />}
          <div className="px-6 py-7 md:px-10">
            <div className="flex flex-wrap items-center gap-2">
              <BlogStatusBadge status={post.status} />
              {post.category && <Badge variant="secondary">{post.category}</Badge>}
              {post.isFeatured && <Badge variant="outline" className="border-primary/30 text-primary">Nổi bật</Badge>}
            </div>
            <h1 className="mt-4 text-2xl font-bold leading-tight text-foreground md:text-3xl">{post.title}</h1>
            <p className="mt-3 leading-7 text-muted-foreground">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {post.authorName && <span className="flex items-center gap-1.5"><UserRound size={14} />{post.authorName}</span>}
              <span className="flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(post.publishedAt)}</span>
              <span className="flex items-center gap-1.5"><Clock3 size={14} />{post.readTimeMinutes} phút đọc</span>
            </div>
            <div className="my-7 border-t border-border" />
            <MarkdownRenderer content={post.contentMarkdown} />
            {post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-5">
                {post.tags.map((tag) => <Badge key={tag} variant="outline">#{tag}</Badge>)}
              </div>
            )}
          </div>
        </article>
      )}
    </DialogContent>
  </Dialog>
);

export default BlogPostPreviewDialog;
