namespace DataAccessLayer.Entities;

public class WritingSubmission
{
    public int WritingSubmissionId { get; set; }

    public int UserId { get; set; }

    public int ExamId { get; set; }

    public int? AttemptId { get; set; }

    public string Prompt { get; set; } = string.Empty;

    public string EssayText { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal? Score { get; set; }

    public string? Feedback { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public User? User { get; set; }

    public Exam? Exam { get; set; }

    public ExamAttempt? Attempt { get; set; }
}
