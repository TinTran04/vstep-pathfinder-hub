using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Blog;

public class UpdateBlogPostRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(220)]
    public string? Slug { get; set; }

    [Required]
    [MaxLength(500)]
    public string Excerpt { get; set; } = string.Empty;

    [Required]
    public string ContentMarkdown { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? CoverImageUrl { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    public string[]? Tags { get; set; }

    [MaxLength(150)]
    public string? AuthorName { get; set; }

    public bool IsFeatured { get; set; }

    [Range(1, int.MaxValue)]
    public int? ReadTimeMinutes { get; set; }

    [MaxLength(200)]
    public string? SeoTitle { get; set; }

    [MaxLength(300)]
    public string? SeoDescription { get; set; }

    [Required]
    public string Status { get; set; } = string.Empty;
}
