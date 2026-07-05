import { useEffect, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FilePlus2,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { blogService } from "@/features/blog/services/blog.service";
import type { BlogPost, BlogPostListItem, BlogPostStatus, PagedResponse } from "@/features/blog/types";
import BlogPostFormDialog from "./BlogPostFormDialog";
import BlogPostPreviewDialog from "./BlogPostPreviewDialog";
import BlogStatusBadge from "./BlogStatusBadge";

const PAGE_SIZE = 10;

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
  : "-";

const getErrorMessage = (error: unknown) => error && typeof error === "object" && "message" in error
  ? String(error.message)
  : "Không thể tải dữ liệu Blog.";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

const ActionButton = ({ label, onClick, children, destructive, disabled }: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${destructive ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : "text-muted-foreground"}`}
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const AdminBlogPanel = () => {
  const [result, setResult] = useState<PagedResponse<BlogPostListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"all" | BlogPostStatus>("all");
  const [category, setCategory] = useState("");
  const [debouncedCategory, setDebouncedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPostListItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setDebouncedCategory(category.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, category]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    blogService.getAdminPosts({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      category: debouncedCategory || undefined,
      status: status === "all" ? undefined : status,
      sortBy: "updatedAt",
      desc: true,
    }).then((response) => {
      if (active) setResult(response);
    }).catch((reason: unknown) => {
      if (active) setError(getErrorMessage(reason));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [debouncedCategory, debouncedSearch, page, reloadKey, status]);

  const refresh = () => setReloadKey((value) => value + 1);

  const openCreate = () => {
    setEditingPost(null);
    setFormOpen(true);
  };

  const loadPost = async (postId: number, mode: "edit" | "preview") => {
    setActionId(postId);
    try {
      const post = await blogService.getAdminPostById(postId);
      if (mode === "edit") {
        setEditingPost(post);
        setFormOpen(true);
      } else {
        setPreviewPost(post);
      }
    } catch (reason) {
      toast.error(getErrorMessage(reason));
    } finally {
      setActionId(null);
    }
  };

  const togglePublish = async (post: BlogPostListItem) => {
    setActionId(post.blogPostId);
    try {
      if (post.status === "Published") {
        await blogService.unpublishPost(post.blogPostId);
        toast.success("Đã chuyển bài viết về bản nháp.");
      } else {
        await blogService.publishPost(post.blogPostId);
        toast.success("Đã xuất bản bài viết.");
      }
      refresh();
    } catch (reason) {
      toast.error(getErrorMessage(reason));
    } finally {
      setActionId(null);
    }
  };

  const deletePost = async () => {
    if (!deleteTarget) return;
    setActionId(deleteTarget.blogPostId);
    try {
      await blogService.deletePost(deleteTarget.blogPostId);
      toast.success("Đã xóa bài viết.");
      setDeleteTarget(null);
      if (result?.items.length === 1 && page > 1) setPage((value) => value - 1);
      else refresh();
    } catch (reason) {
      toast.error(getErrorMessage(reason));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Quản lý Blog</h2>
          <p className="text-xs text-muted-foreground">Biên tập và xuất bản nội dung cho VstepUp Journal.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}><FilePlus2 size={15} /> Tạo bài viết</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tiêu đề, slug, mô tả..." className="h-9 pl-9" />
        </div>
        <Select value={status} onValueChange={(value) => { setStatus(value as "all" | BlogPostStatus); setPage(1); }}>
          <SelectTrigger className="h-9 w-full lg:w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Draft">Bản nháp</SelectItem>
            <SelectItem value="Published">Đã xuất bản</SelectItem>
            <SelectItem value="Archived">Lưu trữ</SelectItem>
          </SelectContent>
        </Select>
        <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Lọc chuyên mục" className="h-9 w-full lg:w-48" />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={refresh}><RefreshCw size={14} /> Làm mới</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ảnh</TableHead>
                <TableHead className="min-w-64">Bài viết</TableHead>
                <TableHead>Chuyên mục</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-center">Nổi bật</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead>Xuất bản</TableHead>
                <TableHead className="w-44 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-11 w-14 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-56" /><Skeleton className="mt-2 h-3 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-8 w-32" /></TableCell>
                </TableRow>
              )) : error ? (
                <TableRow><TableCell colSpan={8} className="h-56 text-center"><p className="text-sm font-medium text-foreground">Không thể tải danh sách bài viết</p><p className="mt-1 text-xs text-muted-foreground">{error}</p><Button variant="outline" size="sm" className="mt-4" onClick={refresh}>Thử lại</Button></TableCell></TableRow>
              ) : result && result.items.length > 0 ? result.items.map((post) => {
                const busy = actionId === post.blogPostId;
                return (
                  <TableRow key={post.blogPostId}>
                    <TableCell>
                      <div className="flex h-11 w-14 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                        {post.coverImageUrl ? <img src={post.coverImageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={17} className="text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate text-sm font-semibold text-foreground">{post.title}</p>
                      <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">/{post.slug}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{post.category || "-"}</TableCell>
                    <TableCell><BlogStatusBadge status={post.status} /></TableCell>
                    <TableCell className="text-center">{post.isFeatured ? <Star size={16} className="mx-auto fill-amber-400 text-amber-400" /> : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(post.updatedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(post.publishedAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        {busy ? <Loader2 size={16} className="m-2 animate-spin text-muted-foreground" /> : (
                          <>
                            <ActionButton label="Xem trước" onClick={() => void loadPost(post.blogPostId, "preview")}><Eye size={15} /></ActionButton>
                            <ActionButton label="Chỉnh sửa" onClick={() => void loadPost(post.blogPostId, "edit")}><Edit2 size={15} /></ActionButton>
                            <ActionButton label={post.status === "Published" ? "Gỡ xuất bản" : "Xuất bản"} onClick={() => void togglePublish(post)}>
                              {post.status === "Published" ? <Undo2 size={15} /> : <Send size={15} />}
                            </ActionButton>
                            <ActionButton label="Xóa bài viết" destructive onClick={() => setDeleteTarget(post)}><Trash2 size={15} /></ActionButton>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow><TableCell colSpan={8} className="h-60 text-center"><Archive size={30} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-medium text-foreground">Chưa có bài viết</p><p className="mt-1 text-xs text-muted-foreground">Tạo bài viết đầu tiên cho Journal.</p><Button size="sm" className="mt-4" onClick={openCreate}>Tạo bài viết</Button></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {result && result.totalPages > 1 && !loading && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{result.totalCount} bài viết</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Trang trước"><ChevronLeft size={15} /></Button>
              <span className="min-w-20 text-center text-xs text-muted-foreground">{result.page} / {result.totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Trang sau"><ChevronRight size={15} /></Button>
            </div>
          </div>
        )}
      </div>

      <BlogPostFormDialog open={formOpen} onOpenChange={setFormOpen} post={editingPost} onSaved={refresh} />
      <BlogPostPreviewDialog open={Boolean(previewPost)} onOpenChange={(open) => !open && setPreviewPost(null)} post={previewPost} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài “{deleteTarget?.title}” sẽ bị ẩn khỏi Journal. Hành động này không thể hoàn tác từ giao diện quản trị.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionId !== null}>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={actionId !== null} onClick={(event) => { event.preventDefault(); void deletePost(); }}>
              {actionId !== null ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Trash2 size={16} className="mr-2" />} Xóa bài viết
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlogPanel;
