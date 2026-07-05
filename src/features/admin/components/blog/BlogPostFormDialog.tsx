import { useEffect, useState } from "react";
import { Eye, FileText, ImagePlus, Loader2, Save, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import MarkdownRenderer from "@/features/blog/components/MarkdownRenderer";
import { blogService } from "@/features/blog/services/blog.service";
import type { BlogPost, BlogPostStatus, CreateBlogPostPayload, UpdateBlogPostPayload } from "@/features/blog/types";

interface BlogPostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
  onSaved: () => void;
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  coverImageUrl: string;
  category: string;
  tags: string;
  authorName: string;
  isFeatured: boolean;
  readTimeMinutes: string;
  seoTitle: string;
  seoDescription: string;
  status: BlogPostStatus;
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  contentMarkdown: "",
  coverImageUrl: "",
  category: "",
  tags: "",
  authorName: "",
  isFeatured: false,
  readTimeMinutes: "",
  seoTitle: "",
  seoDescription: "",
  status: "Draft",
};

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const COVER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const generateSlug = (value: string) => value
  .trim()
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const BlogPostFormDialog = ({ open, onOpenChange, post, onSaved }: BlogPostFormDialogProps) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const isEditing = Boolean(post);

  useEffect(() => {
    if (!open) return;
    if (post) {
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentMarkdown: post.contentMarkdown,
        coverImageUrl: post.coverImageUrl ?? "",
        category: post.category ?? "",
        tags: post.tags.join(", "),
        authorName: post.authorName ?? "",
        isFeatured: post.isFeatured,
        readTimeMinutes: post.readTimeMinutes ? String(post.readTimeMinutes) : "",
        seoTitle: post.seoTitle ?? "",
        seoDescription: post.seoDescription ?? "",
        status: post.status,
      });
      setSlugEdited(true);
    } else {
      setForm(emptyForm);
      setSlugEdited(false);
    }
  }, [open, post]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugEdited ? current.slug : generateSlug(value),
    }));
  };

  const validate = () => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.contentMarkdown.trim()) {
      toast.error("Vui lòng nhập tiêu đề, mô tả ngắn và nội dung bài viết.");
      return false;
    }
    if (!form.slug.trim()) {
      toast.error("Slug không hợp lệ.");
      return false;
    }
    const readTime = form.readTimeMinutes ? Number(form.readTimeMinutes) : null;
    if (readTime !== null && (!Number.isInteger(readTime) || readTime < 1)) {
      toast.error("Thời gian đọc phải là số nguyên lớn hơn 0.");
      return false;
    }
    return true;
  };

  const uploadCover = async (file: File) => {
    if (!COVER_IMAGE_TYPES.has(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.");
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      toast.error("Ảnh bìa không được vượt quá 5MB.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!extension) {
      toast.error("Không xác định được phần mở rộng của ảnh.");
      return;
    }

    setUploadingCover(true);
    try {
      const upload = await blogService.createCoverUploadUrl(file.type, extension);
      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with HTTP ${response.status}.`);
      }

      updateField("coverImageUrl", upload.publicUrl);
      toast.success("Đã tải ảnh bìa lên.");
    } catch (error) {
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : "Không thể tải ảnh bìa.";
      toast.error(message);
    } finally {
      setUploadingCover(false);
    }
  };

  const submit = async (publishNow: boolean) => {
    if (!validate() || uploadingCover) return;
    setSaving(true);

    const common = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      contentMarkdown: form.contentMarkdown.trim(),
      coverImageUrl: form.coverImageUrl.trim() || null,
      category: form.category.trim() || null,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      authorName: form.authorName.trim() || null,
      isFeatured: form.isFeatured,
      readTimeMinutes: form.readTimeMinutes ? Number(form.readTimeMinutes) : null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
    };

    try {
      if (post) {
        const payload: UpdateBlogPostPayload = { ...common, status: form.status };
        await blogService.updatePost(post.blogPostId, payload);
        toast.success("Đã cập nhật bài viết.");
      } else {
        const payload: CreateBlogPostPayload = { ...common, publishNow };
        await blogService.createPost(payload);
        toast.success(publishNow ? "Đã tạo và xuất bản bài viết." : "Đã lưu bản nháp.");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : "Không thể lưu bài viết.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !saving && !uploadingCover && onOpenChange(value)}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 text-left">
          <DialogTitle>{isEditing ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</DialogTitle>
          <DialogDescription>Nội dung Markdown sẽ được lọc an toàn trước khi hiển thị trên Journal.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="blog-title">Tiêu đề *</Label>
                <Input id="blog-title" maxLength={200} value={form.title} onChange={(event) => handleTitleChange(event.target.value)} placeholder="Nhập tiêu đề bài viết" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-slug">Slug *</Label>
                <Input id="blog-slug" maxLength={220} value={form.slug} onChange={(event) => { setSlugEdited(true); updateField("slug", generateSlug(event.target.value)); }} placeholder="duong-dan-bai-viet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-excerpt">Mô tả ngắn *</Label>
                <Textarea id="blog-excerpt" maxLength={500} rows={3} value={form.excerpt} onChange={(event) => updateField("excerpt", event.target.value)} placeholder="Tóm tắt nội dung hiển thị trên thẻ bài viết" />
                <p className="text-right text-xs text-muted-foreground">{form.excerpt.length}/500</p>
              </div>

              <Tabs defaultValue="write">
                <TabsList>
                  <TabsTrigger value="write" className="gap-1.5"><FileText size={14} /> Markdown</TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1.5"><Eye size={14} /> Xem trước</TabsTrigger>
                </TabsList>
                <TabsContent value="write" className="mt-3">
                  <Textarea className="min-h-[360px] resize-y font-mono text-sm leading-6" value={form.contentMarkdown} onChange={(event) => updateField("contentMarkdown", event.target.value)} placeholder="# Tiêu đề nội dung&#10;&#10;Viết nội dung Markdown tại đây..." />
                </TabsContent>
                <TabsContent value="preview" className="mt-3 min-h-[360px] rounded-lg border border-border bg-card p-5">
                  {form.contentMarkdown.trim() ? <MarkdownRenderer content={form.contentMarkdown} /> : <p className="text-sm text-muted-foreground">Chưa có nội dung để xem trước.</p>}
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="blog-cover">URL ảnh bìa</Label>
                <Input id="blog-cover" maxLength={1000} value={form.coverImageUrl} onChange={(event) => updateField("coverImageUrl", event.target.value)} placeholder="https://..." />
                <div className="flex items-center gap-2">
                  <Input
                    id="blog-cover-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploadingCover}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadCover(file);
                      event.target.value = "";
                    }}
                  />
                  <Label
                    htmlFor="blog-cover-file"
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {uploadingCover ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    {uploadingCover ? "Đang tải lên..." : "Tải ảnh lên"}
                  </Label>
                  <span className="text-xs text-muted-foreground">JPEG, PNG, WebP · tối đa 5MB</span>
                </div>
                {form.coverImageUrl ? (
                  <div className="relative overflow-hidden rounded-md border border-border">
                    <img src={form.coverImageUrl} alt="Xem trước ảnh bìa" className="aspect-[16/8] w-full object-cover" />
                    <Button type="button" variant="secondary" size="icon" className="absolute right-2 top-2 h-8 w-8" onClick={() => updateField("coverImageUrl", "")} aria-label="Xóa ảnh bìa" title="Xóa ảnh bìa">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex aspect-[16/7] items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground">
                    <ImagePlus size={28} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="blog-category">Chuyên mục</Label>
                  <Input id="blog-category" maxLength={100} value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Kỹ năng Writing" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-author">Tác giả</Label>
                  <Input id="blog-author" maxLength={150} value={form.authorName} onChange={(event) => updateField("authorName", event.target.value)} placeholder="VstepUp Editorial" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-tags">Tags</Label>
                <Input id="blog-tags" value={form.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="writing, chiến lược, B2" />
                <p className="text-xs text-muted-foreground">Phân cách các tag bằng dấu phẩy.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-read-time">Thời gian đọc</Label>
                <Input id="blog-read-time" type="number" min={1} step={1} value={form.readTimeMinutes} onChange={(event) => updateField("readTimeMinutes", event.target.value)} placeholder="Tự động tính" />
              </div>
              {isEditing && (
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={form.status} onValueChange={(value) => updateField("status", value as BlogPostStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Bản nháp</SelectItem>
                      <SelectItem value="Published">Đã xuất bản</SelectItem>
                      <SelectItem value="Archived">Lưu trữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="blog-featured">Bài viết nổi bật</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Ưu tiên hiển thị trên landing page.</p>
                </div>
                <Switch id="blog-featured" checked={form.isFeatured} onCheckedChange={(checked) => updateField("isFeatured", checked)} />
              </div>
              <div className="space-y-2 border-t border-border pt-5">
                <Label htmlFor="blog-seo-title">SEO title</Label>
                <Input id="blog-seo-title" maxLength={200} value={form.seoTitle} onChange={(event) => updateField("seoTitle", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-seo-description">SEO description</Label>
                <Textarea id="blog-seo-description" maxLength={300} rows={3} value={form.seoDescription} onChange={(event) => updateField("seoDescription", event.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || uploadingCover}>Hủy</Button>
          {isEditing ? (
            <Button onClick={() => void submit(false)} disabled={saving || uploadingCover} className="gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu thay đổi
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => void submit(false)} disabled={saving || uploadingCover} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu bản nháp
              </Button>
              <Button onClick={() => void submit(true)} disabled={saving || uploadingCover} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Xuất bản ngay
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostFormDialog;
