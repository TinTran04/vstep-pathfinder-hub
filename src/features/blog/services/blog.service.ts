import { apiClient } from "@/services/api-client";
import type {
  BlogPost,
  BlogPostListItem,
  BlogPostQuery,
  BlogCoverUploadUrlResponse,
  CreateBlogPostPayload,
  MessageResponse,
  PagedResponse,
  UpdateBlogPostPayload,
} from "../types";

const buildQueryString = (query?: BlogPostQuery): string => {
  if (!query) return "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const value = params.toString();
  return value ? `?${value}` : "";
};

export const blogService = {
  getPosts(query?: BlogPostQuery): Promise<PagedResponse<BlogPostListItem>> {
    return apiClient.get(`/blog-posts${buildQueryString(query)}`);
  },

  getFeaturedPosts(take = 3): Promise<BlogPostListItem[]> {
    return apiClient.get(`/blog-posts/featured?take=${encodeURIComponent(take)}`);
  },

  getPostBySlug(slug: string): Promise<BlogPost> {
    return apiClient.get(`/blog-posts/${encodeURIComponent(slug)}`);
  },

  getAdminPosts(query?: BlogPostQuery): Promise<PagedResponse<BlogPostListItem>> {
    return apiClient.get(`/blog-posts/admin${buildQueryString(query)}`);
  },

  getAdminPostById(id: number): Promise<BlogPost> {
    return apiClient.get(`/blog-posts/admin/${id}`);
  },

  createPost(payload: CreateBlogPostPayload): Promise<BlogPost> {
    return apiClient.post("/blog-posts", payload);
  },

  updatePost(id: number, payload: UpdateBlogPostPayload): Promise<BlogPost> {
    return apiClient.put(`/blog-posts/${id}`, payload);
  },

  publishPost(id: number): Promise<BlogPost> {
    return apiClient.patch(`/blog-posts/${id}/publish`);
  },

  unpublishPost(id: number): Promise<BlogPost> {
    return apiClient.patch(`/blog-posts/${id}/unpublish`);
  },

  deletePost(id: number): Promise<MessageResponse> {
    return apiClient.delete(`/blog-posts/${id}`);
  },

  createCoverUploadUrl(contentType: string, fileExtension: string): Promise<BlogCoverUploadUrlResponse> {
    return apiClient.post("/blog-posts/cover-upload-url", { contentType, fileExtension });
  },
};
