using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Blog;

public class CreateBlogCoverUploadUrlRequest
{
    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string FileExtension { get; set; } = string.Empty;
}

public class BlogCoverUploadUrlResponse
{
    public string UploadUrl { get; set; } = string.Empty;
    public string ObjectKey { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
