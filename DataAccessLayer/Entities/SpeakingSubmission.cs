namespace DataAccessLayer.Entities;

public class SpeakingSubmission
{
    public int SpeakingSubmissionId { get; set; }

    public int UserId { get; set; }

    public int ExamId { get; set; }

    public int? AttemptId { get; set; }

    public int? PartNumber { get; set; }

    public string AudioObjectKey { get; set; } = string.Empty;

    public string AudioUrl { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal? Score { get; set; }

    public int? DurationUsedSeconds { get; set; }

    public string? Feedback { get; set; }

    public string? FeedbackJson { get; set; }

    public string? Transcript { get; set; }

    public DateTime? AutoDeleteAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public User? User { get; set; }

    public Exam? Exam { get; set; }

    public ExamAttempt? Attempt { get; set; }
}
