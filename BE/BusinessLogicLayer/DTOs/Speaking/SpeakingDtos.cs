using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Speaking;

public class CreateSpeakingUploadUrlRequest
{
    [Required]
    public int ExamId { get; set; }

    [MaxLength(100)]
    public string ContentType { get; set; } = "audio/webm";
}

public class SpeakingUploadUrlResponse
{
    public string UploadUrl { get; set; } = string.Empty;

    public string AudioObjectKey { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
}

public class SubmitSpeakingRequest
{
    [Required]
    [MaxLength(1000)]
    public string AudioObjectKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string AudioUrl { get; set; } = string.Empty;
}

public class SpeakingSubmissionResponse
{
    public int SpeakingSubmissionId { get; set; }

    public int UserId { get; set; }

    public int ExamId { get; set; }

    public int? AttemptId { get; set; }

    public string AudioObjectKey { get; set; } = string.Empty;

    public string AudioUrl { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal? Score { get; set; }

    public string? Feedback { get; set; }

    public DateTime? AutoDeleteAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

public class SpeakingResultResponse : SpeakingSubmissionResponse
{
}
