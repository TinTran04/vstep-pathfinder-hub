using System.Linq.Expressions;
using DataAccessLayer.Context;
using DataAccessLayer.Core;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class BlogPostRepository : IBlogPostRepository
{
    private readonly ApplicationDbContext _context;

    public BlogPostRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<PagedResult<BlogPostProjection>> GetPublishedAsync(BlogPostQueryParameters parameters)
    {
        var utcNow = DateTime.UtcNow;
        var query = _context.BlogPosts
            .AsNoTracking()
            .Where(post => post.Status == BlogPostStatus.Published &&
                           post.PublishedAt.HasValue &&
                           post.PublishedAt.Value <= utcNow);

        query = ApplyFilters(query, parameters, includeStatus: false);
        query = ApplySorting(query, parameters.SortBy, parameters.Desc, publicQuery: true);

        return ToPagedResultAsync(query, parameters);
    }

    public Task<List<BlogPostProjection>> GetFeaturedAsync(int take)
    {
        if (take <= 0)
        {
            return Task.FromResult(new List<BlogPostProjection>());
        }

        var utcNow = DateTime.UtcNow;
        return _context.BlogPosts
            .AsNoTracking()
            .Where(post => post.Status == BlogPostStatus.Published &&
                           post.PublishedAt.HasValue &&
                           post.PublishedAt.Value <= utcNow &&
                           post.IsFeatured)
            .OrderByDescending(post => post.PublishedAt)
            .ThenByDescending(post => post.CreatedAt)
            .Take(Math.Min(take, 50))
            .Select(PostProjection)
            .ToListAsync();
    }

    public Task<BlogPostProjection?> GetPublishedBySlugAsync(string slug)
    {
        var normalizedSlug = slug.Trim().ToLower();
        var utcNow = DateTime.UtcNow;

        return _context.BlogPosts
            .AsNoTracking()
            .Where(post => post.Status == BlogPostStatus.Published &&
                           post.PublishedAt.HasValue &&
                           post.PublishedAt.Value <= utcNow &&
                           post.Slug.ToLower() == normalizedSlug)
            .Select(PostProjection)
            .FirstOrDefaultAsync();
    }

    public Task<PagedResult<BlogPostProjection>> GetForAdminAsync(BlogPostQueryParameters parameters)
    {
        var query = ApplyFilters(_context.BlogPosts.AsNoTracking(), parameters, includeStatus: true);
        query = ApplySorting(query, parameters.SortBy, parameters.Desc, publicQuery: false);

        return ToPagedResultAsync(query, parameters);
    }

    public Task<BlogPost?> GetTrackedByIdAsync(int blogPostId)
    {
        return _context.BlogPosts
            .FirstOrDefaultAsync(post => post.BlogPostId == blogPostId);
    }

    public Task<BlogPost?> GetBySlugAsync(string slug)
    {
        var normalizedSlug = slug.Trim().ToLower();
        return _context.BlogPosts
            .AsNoTracking()
            .FirstOrDefaultAsync(post => post.Slug.ToLower() == normalizedSlug);
    }

    public Task<bool> ExistsBySlugExceptIdAsync(string slug, int blogPostId)
    {
        var normalizedSlug = slug.Trim().ToLower();
        return _context.BlogPosts
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(post => post.Slug.ToLower() == normalizedSlug &&
                              post.BlogPostId != blogPostId);
    }

    public Task AddAsync(BlogPost blogPost)
    {
        return _context.BlogPosts.AddAsync(blogPost).AsTask();
    }

    public void Update(BlogPost blogPost)
    {
        _context.BlogPosts.Update(blogPost);
    }

    private static IQueryable<BlogPost> ApplyFilters(
        IQueryable<BlogPost> query,
        BlogPostQueryParameters parameters,
        bool includeStatus)
    {
        if (!string.IsNullOrWhiteSpace(parameters.Search))
        {
            var search = parameters.Search.Trim().ToLower();
            query = query.Where(post =>
                post.Title.ToLower().Contains(search) ||
                post.Excerpt.ToLower().Contains(search) ||
                (post.Category != null && post.Category.ToLower().Contains(search)) ||
                (post.Tags != null && post.Tags.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(parameters.Category))
        {
            var category = parameters.Category.Trim().ToLower();
            query = query.Where(post => post.Category != null && post.Category.ToLower() == category);
        }

        if (!string.IsNullOrWhiteSpace(parameters.Tag))
        {
            var tag = parameters.Tag.Trim().ToLower();
            query = query.Where(post => post.Tags != null && post.Tags.ToLower().Contains(tag));
        }

        if (includeStatus && parameters.Status.HasValue)
        {
            query = query.Where(post => post.Status == parameters.Status.Value);
        }

        if (parameters.IsFeatured.HasValue)
        {
            query = query.Where(post => post.IsFeatured == parameters.IsFeatured.Value);
        }

        return query;
    }

    private static IOrderedQueryable<BlogPost> ApplySorting(
        IQueryable<BlogPost> query,
        string? sortBy,
        bool descending,
        bool publicQuery)
    {
        var normalizedSort = sortBy?.Trim().ToLowerInvariant();

        return normalizedSort switch
        {
            "publishedat" => descending
                ? query.OrderByDescending(post => post.PublishedAt)
                : query.OrderBy(post => post.PublishedAt),
            "createdat" => descending
                ? query.OrderByDescending(post => post.CreatedAt)
                : query.OrderBy(post => post.CreatedAt),
            "title" => descending
                ? query.OrderByDescending(post => post.Title)
                : query.OrderBy(post => post.Title),
            "updatedat" => descending
                ? query.OrderByDescending(post => post.UpdatedAt)
                : query.OrderBy(post => post.UpdatedAt),
            _ when publicQuery => query.OrderByDescending(post => post.PublishedAt),
            _ => query.OrderByDescending(post => post.UpdatedAt)
        };
    }

    private static async Task<PagedResult<BlogPostProjection>> ToPagedResultAsync(
        IQueryable<BlogPost> query,
        BlogPostQueryParameters parameters)
    {
        var page = Math.Max(1, parameters.Page);
        var pageSize = parameters.PageSize is < 1 or > 100 ? 10 : parameters.PageSize;
        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(PostProjection)
            .ToListAsync();

        return new PagedResult<BlogPostProjection>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    private static readonly Expression<Func<BlogPost, BlogPostProjection>> PostProjection = post =>
        new BlogPostProjection
        {
            BlogPostId = post.BlogPostId,
            Title = post.Title,
            Slug = post.Slug,
            Excerpt = post.Excerpt,
            ContentMarkdown = post.ContentMarkdown,
            CoverImageUrl = post.CoverImageUrl,
            Category = post.Category,
            Tags = post.Tags,
            AuthorName = post.AuthorName,
            Status = post.Status,
            IsFeatured = post.IsFeatured,
            ReadTimeMinutes = post.ReadTimeMinutes,
            SeoTitle = post.SeoTitle,
            SeoDescription = post.SeoDescription,
            PublishedAt = post.PublishedAt,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
}
