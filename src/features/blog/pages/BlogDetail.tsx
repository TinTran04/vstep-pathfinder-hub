import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FooterSection from "@/features/landing/components/FooterSection";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { blogService } from "../services/blog.service";
import type { BlogPost } from "../types";

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value))
  : "Chưa cập nhật";

const BlogDetailSkeleton = () => (
  <main className="mx-auto max-w-4xl px-4 pb-16 pt-28 md:px-8 md:pt-32">
    <Skeleton className="h-5 w-32" />
    <Skeleton className="mt-8 h-12 w-full" />
    <Skeleton className="mt-3 h-12 w-4/5" />
    <Skeleton className="mt-6 h-5 w-2/3" />
    <Skeleton className="mt-8 aspect-[16/8] w-full rounded-lg" />
    <div className="mt-10 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  </main>
);

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!slug) {
      setError("Không tìm thấy bài viết.");
      setLoading(false);
      return () => { active = false; };
    }

    blogService.getPostBySlug(slug)
      .then((response) => { if (active) setPost(response); })
      .catch((reason: unknown) => {
        if (!active) return;
        const status = reason && typeof reason === "object" && "status" in reason ? Number(reason.status) : 0;
        setError(status === 404 ? "Bài viết không tồn tại hoặc chưa được xuất bản." : "Không thể tải bài viết. Vui lòng thử lại sau.");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    const previousTitle = document.title;
    if (post) document.title = post.seoTitle || `${post.title} | VstepUp Journal`;
    return () => { document.title = previousTitle; };
  }, [post]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {loading ? (
        <BlogDetailSkeleton />
      ) : error || !post ? (
        <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 pt-20 text-center">
          <p className="text-sm font-semibold text-primary">VstepUp Journal</p>
          <h1 className="mt-3 text-3xl font-bold text-foreground">Không tìm thấy bài viết</h1>
          <p className="mt-3 text-muted-foreground">{error}</p>
          <Button asChild className="mt-6 gap-2"><Link to="/blog"><ArrowLeft size={16} /> Quay lại Blog</Link></Button>
        </main>
      ) : (
        <main>
          <article>
            <header className="border-b border-border bg-card pb-10 pt-28 md:pb-14 md:pt-32">
              <div className="mx-auto max-w-4xl px-4 md:px-8">
                <Button variant="ghost" size="sm" asChild className="mb-7 -ml-3 gap-2 text-muted-foreground">
                  <Link to="/blog"><ArrowLeft size={16} /> Quay lại Blog</Link>
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  {post.category && <Badge variant="secondary">{post.category}</Badge>}
                  {post.isFeatured && <Badge variant="outline" className="border-primary/30 text-primary">Nổi bật</Badge>}
                </div>
                <h1 className="mt-5 text-3xl font-extrabold leading-tight text-foreground md:text-5xl">{post.title}</h1>
                <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">{post.excerpt}</p>

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  {post.authorName && <span className="flex items-center gap-1.5"><UserRound size={16} />{post.authorName}</span>}
                  <span className="flex items-center gap-1.5"><CalendarDays size={16} />{formatDate(post.publishedAt)}</span>
                  <span className="flex items-center gap-1.5"><Clock3 size={16} />{post.readTimeMinutes} phút đọc</span>
                </div>
              </div>
            </header>

            <div className="mx-auto max-w-5xl px-4 md:px-8">
              {post.coverImageUrl && (
                <img src={post.coverImageUrl} alt={post.title} className="mt-8 aspect-[16/8] w-full rounded-lg border border-border object-cover md:mt-10" />
              )}
            </div>

            <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
              <MarkdownRenderer content={post.contentMarkdown} />
              {post.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-6">
                  {post.tags.map((tag) => <Badge key={tag} variant="outline">#{tag}</Badge>)}
                </div>
              )}
            </div>
          </article>
        </main>
      )}

      <FooterSection />
    </div>
  );
};

export default BlogDetail;
