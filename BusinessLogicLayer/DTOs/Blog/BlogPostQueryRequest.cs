namespace BusinessLogicLayer.DTOs.Blog;

public class BlogPostQueryRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Tag { get; set; }
    public string? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public string? SortBy { get; set; }
    public bool Desc { get; set; } = true;
}
