export type BlogPostStatus = "Draft" | "Published" | "Archived";

export interface BlogPostListItem {
  blogPostId: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string | null;
  tags: string[];
  authorName: string | null;
  status: BlogPostStatus;
  isFeatured: boolean;
  readTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost extends BlogPostListItem {
  contentMarkdown: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface BlogPostQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  tag?: string;
  status?: BlogPostStatus;
  isFeatured?: boolean;
  sortBy?: "publishedAt" | "createdAt" | "title" | "updatedAt";
  desc?: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateBlogPostPayload {
  title: string;
  slug?: string | null;
  excerpt: string;
  contentMarkdown: string;
  coverImageUrl?: string | null;
  category?: string | null;
  tags?: string[];
  authorName?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isFeatured: boolean;
  readTimeMinutes?: number | null;
  publishNow: boolean;
}

export interface UpdateBlogPostPayload extends Omit<CreateBlogPostPayload, "publishNow"> {
  status: BlogPostStatus;
}

export interface MessageResponse {
  message: string;
}

export interface BlogCoverUploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresAt: string;
}
