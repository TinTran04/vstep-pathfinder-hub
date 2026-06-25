namespace DataAccessLayer.Entities;

public class ExamAttempt
{
    public int AttemptId { get; set; }

    public int UserId { get; set; }

    public int ExamId { get; set; }

    public string SkillType { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public decimal? Score { get; set; }

    public int? TotalQuestions { get; set; }

    public int? CorrectCount { get; set; }

    public int? DurationUsedSeconds { get; set; }

    public string? DraftStateJson { get; set; }

    public string? CurrentSkill { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public int? DurationMinutes { get; set; }

    public DateTime? LastAutosavedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public User? User { get; set; }

    public Exam? Exam { get; set; }

    public ICollection<ExamAttemptAnswer> Answers { get; set; } = new List<ExamAttemptAnswer>();
}
