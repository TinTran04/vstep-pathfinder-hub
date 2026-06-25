using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Writing;

public class SubmitWritingRequest
{
    [Required]
    [MaxLength(3000)]
    public string Prompt { get; set; } = string.Empty;

    [Required]
    public string EssayText { get; set; } = string.Empty;

    public int? DurationUsedSeconds { get; set; }

    public int? AttemptId { get; set; }
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

    public int? DurationUsedSeconds { get; set; }

    public string? Feedback { get; set; }

    public string? FeedbackJson { get; set; }

    public decimal? TaskResponse { get; set; }

    public decimal? Grammar { get; set; }

    public decimal? Vocabulary { get; set; }

    public decimal? Organization { get; set; }

    public List<string> FeedbackPoints { get; set; } = new();

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

public class WritingResultResponse : WritingSubmissionResponse
{
}
