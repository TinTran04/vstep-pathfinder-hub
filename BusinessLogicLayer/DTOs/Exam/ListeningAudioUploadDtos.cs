using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Exam;

public class CreateListeningAudioUploadUrlRequest
{
    public int? ExamId { get; set; }

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = "audio/mpeg";

    [MaxLength(10)]
    public string? FileExtension { get; set; }
}

public class ListeningAudioUploadUrlResponse
{
    public string UploadUrl { get; set; } = string.Empty;

    public string AudioObjectKey { get; set; } = string.Empty;

    public string AudioUrl { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
}
