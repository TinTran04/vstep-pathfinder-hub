using DataAccessLayer.Core;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IBlogPostRepository
{
    Task<PagedResult<BlogPostProjection>> GetPublishedAsync(BlogPostQueryParameters parameters);
    Task<List<BlogPostProjection>> GetFeaturedAsync(int take);
    Task<BlogPostProjection?> GetPublishedBySlugAsync(string slug);
    Task<PagedResult<BlogPostProjection>> GetForAdminAsync(BlogPostQueryParameters parameters);
    Task<BlogPost?> GetTrackedByIdAsync(int blogPostId);
    Task<BlogPost?> GetBySlugAsync(string slug);
    Task<bool> ExistsBySlugExceptIdAsync(string slug, int blogPostId);
    Task AddAsync(BlogPost blogPost);
    void Update(BlogPost blogPost);
}
