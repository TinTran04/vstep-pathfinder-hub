import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FooterSection from "@/features/landing/components/FooterSection";
import BlogCard from "../components/BlogCard";
import BlogFilters from "../components/BlogFilters";
import BlogHero from "../components/BlogHero";
import { blogService } from "../services/blog.service";
import type { BlogPostListItem, PagedResponse } from "../types";

const PAGE_SIZE = 9;

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "status" in error && Number((error as { status?: number }).status) === 404) {
    return "Nội dung Blog đang được cập nhật. Vui lòng quay lại sau.";
  }

  if (error && typeof error === "object" && "message" in error) {
    return "Không thể tải danh sách bài viết. Vui lòng thử lại sau.";
  }
  return "Không thể tải danh sách bài viết. Vui lòng thử lại sau.";
};

const BlogListSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }, (_, index) => (
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
);

const BlogList = () => {
  const [posts, setPosts] = useState<PagedResponse<BlogPostListItem> | null>(null);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPostListItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    blogService.getPosts({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      category: category || undefined,
      sortBy: "publishedAt",
      desc: true,
    }).then((response) => {
      if (active) setPosts(response);
    }).catch((reason: unknown) => {
      if (active) setError(getErrorMessage(reason));
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [page, category, debouncedSearch, reloadKey]);

  useEffect(() => {
    let active = true;
    blogService.getFeaturedPosts(3)
      .then((response) => { if (active) setFeaturedPosts(response); })
      .catch(() => { if (active) setFeaturedPosts([]); });
    return () => { active = false; };
  }, [reloadKey]);

  const categories = useMemo(() => {
    const values = [...featuredPosts, ...(posts?.items ?? [])]
      .map((post) => post.category)
      .filter((value): value is string => Boolean(value));
    if (category) values.push(category);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "vi"));
  }, [category, featuredPosts, posts]);

  const showFeatured = page === 1 && !debouncedSearch && !category && featuredPosts.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BlogHero />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        {showFeatured && (
          <section className="mb-12" aria-labelledby="featured-heading">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">Được chọn bởi VstepUp</p>
                <h2 id="featured-heading" className="mt-1 text-2xl font-bold text-foreground">Bài viết nổi bật</h2>
              </div>
            </div>
            <BlogCard post={featuredPosts[0]} featured />
          </section>
        )}

        <section aria-labelledby="latest-heading">
          <div className="mb-6">
            <p className="text-sm font-semibold text-primary">Khám phá kiến thức</p>
            <h2 id="latest-heading" className="mt-1 text-2xl font-bold text-foreground">Bài viết mới nhất</h2>
          </div>

          <BlogFilters
            search={search}
            category={category}
            categories={categories}
            onSearchChange={setSearch}
            onCategoryChange={(value) => { setCategory(value); setPage(1); }}
            onClear={() => { setSearch(""); setDebouncedSearch(""); setCategory(""); setPage(1); }}
          />

          <div className="mt-7">
            {loading ? (
              <BlogListSkeleton />
            ) : error ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center">
                <AlertCircle className="mb-3 text-destructive" size={34} />
                <h3 className="font-semibold text-foreground">Chưa thể tải bài viết</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
                <Button className="mt-5 gap-2" onClick={() => setReloadKey((value) => value + 1)}>
                  <RefreshCw size={16} /> Thử lại
                </Button>
              </div>
            ) : posts && posts.items.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {posts.items.map((post) => <BlogCard key={post.blogPostId} post={post} />)}
                </div>

                {posts.totalPages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Phân trang bài viết">
                    <Button variant="outline" size="sm" className="gap-1" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                      <ChevronLeft size={16} /> Trước
                    </Button>
                    <span className="min-w-24 text-center text-sm text-muted-foreground">
                      Trang <strong className="text-foreground">{posts.page}</strong> / {posts.totalPages}
                    </span>
                    <Button variant="outline" size="sm" className="gap-1" disabled={page >= posts.totalPages} onClick={() => setPage((value) => value + 1)}>
                      Sau <ChevronRight size={16} />
                    </Button>
                  </nav>
                )}
              </>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center">
                <BookOpen className="mb-3 text-muted-foreground" size={36} />
                <h3 className="font-semibold text-foreground">Chưa có bài viết phù hợp</h3>
                <p className="mt-2 text-sm text-muted-foreground">Thử thay đổi từ khóa hoặc chuyên mục đang chọn.</p>
                {(search || category) && <Button variant="outline" className="mt-5" onClick={() => { setSearch(""); setDebouncedSearch(""); setCategory(""); }}>Xem tất cả bài viết</Button>}
              </div>
            )}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
};

export default BlogList;
