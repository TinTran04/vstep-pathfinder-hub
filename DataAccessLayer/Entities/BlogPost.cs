namespace DataAccessLayer.Entities;

public class BlogPost
{
    public int BlogPostId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Excerpt { get; set; } = string.Empty;

    public string ContentMarkdown { get; set; } = string.Empty;

    public string? CoverImageUrl { get; set; }

    public string? Category { get; set; }

    public string? Tags { get; set; }

    public string? AuthorName { get; set; }

    public BlogPostStatus Status { get; set; } = BlogPostStatus.Draft;

    public bool IsFeatured { get; set; }

    public int ReadTimeMinutes { get; set; }

    public string? SeoTitle { get; set; }

    public string? SeoDescription { get; set; }

    public DateTime? PublishedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }
}
