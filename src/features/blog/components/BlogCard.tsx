import { ArrowUpRight, BookOpen, CalendarDays, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { BlogPostListItem } from "../types";

interface BlogCardProps {
  post: BlogPostListItem;
  featured?: boolean;
}

const formatDate = (value: string | null) => {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const BlogCard = ({ post, featured = false }: BlogCardProps) => (
  <article className={`group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg ${featured ? "md:grid md:grid-cols-[1.15fr_1fr]" : "flex h-full flex-col"}`}>
    <Link to={`/blog/${post.slug}`} className="relative block min-h-48 overflow-hidden bg-muted" aria-label={`Đọc bài ${post.title}`}>
      {post.coverImageUrl ? (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full min-h-48 items-center justify-center text-muted-foreground">
          <BookOpen size={38} strokeWidth={1.5} />
        </div>
      )}
    </Link>

    <div className={`flex flex-1 flex-col ${featured ? "p-6 md:p-8" : "p-5"}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {post.category && <Badge variant="secondary">{post.category}</Badge>}
        {post.isFeatured && <Badge variant="outline" className="border-primary/30 text-primary">Nổi bật</Badge>}
      </div>

      <Link to={`/blog/${post.slug}`} className="group/title">
        <h2 className={`${featured ? "text-2xl md:text-3xl" : "text-lg"} font-bold leading-snug text-foreground transition-colors group-hover/title:text-primary`}>
          {post.title}
        </h2>
      </Link>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs font-medium text-muted-foreground">#{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(post.publishedAt)}</span>
        <span className="flex items-center gap-1.5"><Clock3 size={14} />{post.readTimeMinutes} phút đọc</span>
        <Link to={`/blog/${post.slug}`} className="ml-auto flex items-center gap-1 font-semibold text-primary">
          Đọc bài <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  </article>
);

export default BlogCard;
