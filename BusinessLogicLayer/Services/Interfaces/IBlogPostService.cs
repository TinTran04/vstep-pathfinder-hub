using BusinessLogicLayer.DTOs.Blog;
using BusinessLogicLayer.DTOs.Common;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IBlogPostService
{
    Task<PagedResponse<BlogPostListItemResponse>> GetPublishedAsync(BlogPostQueryRequest request);
    Task<List<BlogPostListItemResponse>> GetFeaturedAsync(int take);
    Task<BlogPostResponse> GetPublishedBySlugAsync(string slug);
    Task<PagedResponse<BlogPostListItemResponse>> GetForAdminAsync(BlogPostQueryRequest request);
    Task<BlogPostResponse> GetAdminByIdAsync(int id);
    Task<BlogPostResponse> CreateAsync(CreateBlogPostRequest request);
    Task<BlogPostResponse> UpdateAsync(int id, UpdateBlogPostRequest request);
    Task<BlogPostResponse> PublishAsync(int id);
    Task<BlogPostResponse> UnpublishAsync(int id);
    Task DeleteAsync(int id);
    Task<BlogCoverUploadUrlResponse> CreateCoverUploadUrlAsync(CreateBlogCoverUploadUrlRequest request);
}
