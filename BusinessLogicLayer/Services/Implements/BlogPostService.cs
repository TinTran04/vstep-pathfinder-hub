using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using BusinessLogicLayer.DTOs.Blog;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class BlogPostService : IBlogPostService
{
    private const int WordsPerMinute = 200;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IR2StorageService _r2StorageService;

    public BlogPostService(IUnitOfWork unitOfWork, IR2StorageService r2StorageService)
    {
        _unitOfWork = unitOfWork;
        _r2StorageService = r2StorageService;
    }

    public async Task<PagedResponse<BlogPostListItemResponse>> GetPublishedAsync(BlogPostQueryRequest request)
    {
        var result = await _unitOfWork.BlogPosts.GetPublishedAsync(MapQuery(request));
        return MapPagedResult(result);
    }

    public async Task<List<BlogPostListItemResponse>> GetFeaturedAsync(int take)
    {
        var posts = await _unitOfWork.BlogPosts.GetFeaturedAsync(take);
        return posts.Select(MapListItem).ToList();
    }

    public async Task<BlogPostResponse> GetPublishedBySlugAsync(string slug)
    {
        var normalizedSlug = NormalizeSlug(slug);
        var post = await _unitOfWork.BlogPosts.GetPublishedBySlugAsync(normalizedSlug)
            ?? throw new KeyNotFoundException("Blog post not found.");

        return MapResponse(post);
    }

    public async Task<PagedResponse<BlogPostListItemResponse>> GetForAdminAsync(BlogPostQueryRequest request)
    {
        var result = await _unitOfWork.BlogPosts.GetForAdminAsync(MapQuery(request));
        return MapPagedResult(result);
    }

    public async Task<BlogPostResponse> GetAdminByIdAsync(int id)
    {
        var post = await _unitOfWork.BlogPosts.GetTrackedByIdAsync(id)
            ?? throw new KeyNotFoundException("Blog post not found.");

        return MapResponse(post);
    }

    public async Task<BlogPostResponse> CreateAsync(CreateBlogPostRequest request)
    {
        var title = NormalizeRequired(request.Title, "Title");
        var excerpt = NormalizeRequired(request.Excerpt, "Excerpt");
        var content = NormalizeRequired(request.ContentMarkdown, "ContentMarkdown");
        var slug = NormalizeSlug(string.IsNullOrWhiteSpace(request.Slug) ? title : request.Slug);

        await EnsureUniqueSlugAsync(slug, 0);

        var now = DateTime.UtcNow;
        var post = new BlogPost
        {
            Title = title,
            Slug = slug,
            Excerpt = excerpt,
            ContentMarkdown = content,
            CoverImageUrl = NormalizeOptional(request.CoverImageUrl),
            Category = NormalizeOptional(request.Category),
            Tags = SerializeTags(request.Tags),
            AuthorName = NormalizeOptional(request.AuthorName),
            Status = request.PublishNow ? BlogPostStatus.Published : BlogPostStatus.Draft,
            IsFeatured = request.IsFeatured,
            ReadTimeMinutes = request.ReadTimeMinutes ?? CalculateReadTime(content),
            SeoTitle = NormalizeOptional(request.SeoTitle),
            SeoDescription = NormalizeOptional(request.SeoDescription),
            PublishedAt = request.PublishNow ? now : null,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _unitOfWork.BlogPosts.AddAsync(post);
        await _unitOfWork.SaveChangesAsync();
        return MapResponse(post);
    }

    public async Task<BlogPostResponse> UpdateAsync(int id, UpdateBlogPostRequest request)
    {
        var post = await _unitOfWork.BlogPosts.GetTrackedByIdAsync(id)
            ?? throw new KeyNotFoundException("Blog post not found.");

        var title = NormalizeRequired(request.Title, "Title");
        var excerpt = NormalizeRequired(request.Excerpt, "Excerpt");
        var content = NormalizeRequired(request.ContentMarkdown, "ContentMarkdown");
        var slug = NormalizeSlug(string.IsNullOrWhiteSpace(request.Slug) ? title : request.Slug);
        var status = ParseStatus(request.Status);

        await EnsureUniqueSlugAsync(slug, id);

        post.Title = title;
        post.Slug = slug;
        post.Excerpt = excerpt;
        post.ContentMarkdown = content;
        post.CoverImageUrl = NormalizeOptional(request.CoverImageUrl);
        post.Category = NormalizeOptional(request.Category);
        post.Tags = SerializeTags(request.Tags);
        post.AuthorName = NormalizeOptional(request.AuthorName);
        post.IsFeatured = request.IsFeatured;
        post.ReadTimeMinutes = request.ReadTimeMinutes ?? CalculateReadTime(content);
        post.SeoTitle = NormalizeOptional(request.SeoTitle);
        post.SeoDescription = NormalizeOptional(request.SeoDescription);
        ApplyStatus(post, status);

        _unitOfWork.BlogPosts.Update(post);
        await _unitOfWork.SaveChangesAsync();
        return MapResponse(post);
    }

    public async Task<BlogPostResponse> PublishAsync(int id)
    {
        var post = await _unitOfWork.BlogPosts.GetTrackedByIdAsync(id)
            ?? throw new KeyNotFoundException("Blog post not found.");

        post.Status = BlogPostStatus.Published;
        post.PublishedAt ??= DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();
        return MapResponse(post);
    }

    public async Task<BlogPostResponse> UnpublishAsync(int id)
    {
        var post = await _unitOfWork.BlogPosts.GetTrackedByIdAsync(id)
            ?? throw new KeyNotFoundException("Blog post not found.");

        post.Status = BlogPostStatus.Draft;
        post.PublishedAt = null;
        await _unitOfWork.SaveChangesAsync();
        return MapResponse(post);
    }

    public async Task DeleteAsync(int id)
    {
        var post = await _unitOfWork.BlogPosts.GetTrackedByIdAsync(id)
            ?? throw new KeyNotFoundException("Blog post not found.");

        post.IsDeleted = true;
        _unitOfWork.BlogPosts.Update(post);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<BlogCoverUploadUrlResponse> CreateCoverUploadUrlAsync(CreateBlogCoverUploadUrlRequest request)
    {
        var (uploadUrl, objectKey, expiresAt) = await _r2StorageService.CreateBlogCoverUploadUrlAsync(
            request.ContentType,
            request.FileExtension);

        return new BlogCoverUploadUrlResponse
        {
            UploadUrl = uploadUrl,
            ObjectKey = objectKey,
            PublicUrl = _r2StorageService.GetObjectUrl(objectKey),
            ExpiresAt = expiresAt
        };
    }

    private async Task EnsureUniqueSlugAsync(string slug, int blogPostId)
    {
        if (await _unitOfWork.BlogPosts.ExistsBySlugExceptIdAsync(slug, blogPostId))
        {
            throw new InvalidOperationException("Blog post slug already exists.");
        }
    }

    private static BlogPostQueryParameters MapQuery(BlogPostQueryRequest request)
    {
        return new BlogPostQueryParameters
        {
            Page = request.Page,
            PageSize = request.PageSize,
            Search = NormalizeOptional(request.Search),
            Category = NormalizeOptional(request.Category),
            Tag = NormalizeOptional(request.Tag),
            Status = string.IsNullOrWhiteSpace(request.Status) ? null : ParseStatus(request.Status),
            IsFeatured = request.IsFeatured,
            SortBy = NormalizeSortBy(request.SortBy),
            Desc = request.Desc
        };
    }

    private static string? NormalizeSortBy(string? sortBy)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return null;
        }

        var normalized = sortBy.Trim().ToLowerInvariant();
        return normalized is "publishedat" or "createdat" or "title" or "updatedat"
            ? normalized
            : throw new InvalidOperationException("Invalid blog post sort field.");
    }

    private static BlogPostStatus ParseStatus(string status)
    {
        if (!Enum.TryParse<BlogPostStatus>(status.Trim(), true, out var parsed) ||
            !Enum.IsDefined(parsed))
        {
            throw new InvalidOperationException("Invalid blog post status.");
        }

        return parsed;
    }

    private static void ApplyStatus(BlogPost post, BlogPostStatus status)
    {
        post.Status = status;
        if (status == BlogPostStatus.Published)
        {
            post.PublishedAt ??= DateTime.UtcNow;
        }
        else if (status == BlogPostStatus.Draft)
        {
            post.PublishedAt = null;
        }
    }

    private static string NormalizeSlug(string value)
    {
        var source = value.Trim().Replace('đ', 'd').Replace('Đ', 'D');
        var decomposed = source.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);

        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        var slug = builder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        slug = Regex.Replace(slug, "[^a-z0-9]+", "-").Trim('-');

        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 220)
        {
            throw new InvalidOperationException("Invalid blog post slug.");
        }

        return slug;
    }

    private static int CalculateReadTime(string contentMarkdown)
    {
        var wordCount = Regex.Matches(contentMarkdown, @"\p{L}[\p{L}\p{M}\p{N}'’-]*").Count;
        return Math.Max(1, (int)Math.Ceiling(wordCount / (double)WordsPerMinute));
    }

    private static string? SerializeTags(IEnumerable<string>? tags)
    {
        if (tags is null)
        {
            return null;
        }

        var normalized = tags
            .SelectMany(tag => (tag ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries))
            .Select(tag => tag.Trim())
            .Where(tag => tag.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var serialized = string.Join(',', normalized);
        if (serialized.Length > 500)
        {
            throw new InvalidOperationException("Blog post tags must be 500 characters or fewer.");
        }

        return serialized.Length == 0 ? null : serialized;
    }

    private static string[] DeserializeTags(string? tags)
    {
        return string.IsNullOrWhiteSpace(tags)
            ? Array.Empty<string>()
            : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static string NormalizeRequired(string value, string fieldName)
    {
        var normalized = value.Trim();
        if (normalized.Length == 0)
        {
            throw new InvalidOperationException($"{fieldName} is required.");
        }

        return normalized;
    }

    private static string? NormalizeOptional(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static PagedResponse<BlogPostListItemResponse> MapPagedResult(
        DataAccessLayer.Core.PagedResult<BlogPostProjection> result)
    {
        return new PagedResponse<BlogPostListItemResponse>
        {
            Items = result.Items.Select(MapListItem).ToList(),
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount,
            TotalPages = result.TotalPages
        };
    }

    private static BlogPostListItemResponse MapListItem(BlogPostProjection post)
    {
        return new BlogPostListItemResponse
        {
            BlogPostId = post.BlogPostId,
            Title = post.Title,
            Slug = post.Slug,
            Excerpt = post.Excerpt,
            CoverImageUrl = post.CoverImageUrl,
            Category = post.Category,
            Tags = DeserializeTags(post.Tags),
            AuthorName = post.AuthorName,
            Status = post.Status.ToString(),
            IsFeatured = post.IsFeatured,
            ReadTimeMinutes = post.ReadTimeMinutes,
            PublishedAt = post.PublishedAt,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
    }

    private static BlogPostResponse MapResponse(BlogPostProjection post)
    {
        return new BlogPostResponse
        {
            BlogPostId = post.BlogPostId,
            Title = post.Title,
            Slug = post.Slug,
            Excerpt = post.Excerpt,
            ContentMarkdown = post.ContentMarkdown,
            CoverImageUrl = post.CoverImageUrl,
            Category = post.Category,
            Tags = DeserializeTags(post.Tags),
            AuthorName = post.AuthorName,
            Status = post.Status.ToString(),
            IsFeatured = post.IsFeatured,
            ReadTimeMinutes = post.ReadTimeMinutes,
            SeoTitle = post.SeoTitle,
            SeoDescription = post.SeoDescription,
            PublishedAt = post.PublishedAt,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
    }

    private static BlogPostResponse MapResponse(BlogPost post)
    {
        return new BlogPostResponse
        {
            BlogPostId = post.BlogPostId,
            Title = post.Title,
            Slug = post.Slug,
            Excerpt = post.Excerpt,
            ContentMarkdown = post.ContentMarkdown,
            CoverImageUrl = post.CoverImageUrl,
            Category = post.Category,
            Tags = DeserializeTags(post.Tags),
            AuthorName = post.AuthorName,
            Status = post.Status.ToString(),
            IsFeatured = post.IsFeatured,
            ReadTimeMinutes = post.ReadTimeMinutes,
            SeoTitle = post.SeoTitle,
            SeoDescription = post.SeoDescription,
            PublishedAt = post.PublishedAt,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
    }
}
