import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/StaggerChildren";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BlogCard from "@/features/blog/components/BlogCard";
import { blogService } from "@/features/blog/services/blog.service";
import type { BlogPostListItem } from "@/features/blog/types";

const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      try {
        let featured: BlogPostListItem[] = [];
        try {
          featured = await blogService.getFeaturedPosts(3);
        } catch {
          // The latest-post fallback can still succeed when the featured endpoint is unavailable.
        }

        if (featured.length > 0) {
          if (active) setPosts(featured);
          return;
        }

        const latest = await blogService.getPosts({ page: 1, pageSize: 3, sortBy: "publishedAt", desc: true });
        if (active) setPosts(latest.items);
      } catch {
        if (active) setPosts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPosts();
    return () => { active = false; };
  }, []);

  return (
    <section className="section-padding" aria-labelledby="journal-heading">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Journal</span>
            <h2 id="journal-heading" className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
              Tạp chí học VSTEP
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              Mẹo học từng kỹ năng, chiến lược phòng thi và những câu chuyện giúp hành trình chinh phục VSTEP rõ ràng hơn.
            </p>
          </div>

          <Button variant="outline" asChild className="w-fit shrink-0 gap-2">
            <Link to="/blog">Xem tất cả bài viết <ArrowRight size={16} /></Link>
          </Button>
        </ScrollReveal>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3" aria-label="Đang tải bài viết">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-border bg-card">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <StaggerContainer className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <StaggerItem key={post.blogPostId} className="h-full">
                <BlogCard post={post} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="border-t border-border pt-6 text-sm text-muted-foreground">
            Các bài viết mới đang được biên tập. Ghé lại Journal trong thời gian tới.
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
