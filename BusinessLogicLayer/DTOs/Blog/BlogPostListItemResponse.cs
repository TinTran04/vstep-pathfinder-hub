namespace BusinessLogicLayer.DTOs.Blog;

public class BlogPostListItemResponse
{
    public int BlogPostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string? Category { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string? AuthorName { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public int ReadTimeMinutes { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
