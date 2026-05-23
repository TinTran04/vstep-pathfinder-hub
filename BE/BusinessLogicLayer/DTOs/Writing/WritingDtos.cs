using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Writing;

public class SubmitWritingRequest
{
    [Required]
    [MaxLength(3000)]
    public string Prompt { get; set; } = string.Empty;

    [Required]
    public string EssayText { get; set; } = string.Empty;
}

public class WritingSubmissionResponse
{
    public int WritingSubmissionId { get; set; }

    public int UserId { get; set; }

    public int ExamId { get; set; }

    public int? AttemptId { get; set; }

    public string Prompt { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal? Score { get; set; }

    public string? Feedback { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

public class WritingResultResponse : WritingSubmissionResponse
{
}
