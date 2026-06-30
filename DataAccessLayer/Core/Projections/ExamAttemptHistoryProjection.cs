namespace DataAccessLayer.Core.Projections;

public class ExamAttemptHistoryProjection
{
    public int AttemptId { get; set; }

    public int ExamId { get; set; }

    public string? ExamTitle { get; set; }

    public string SkillType { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public decimal? Score { get; set; }

    public string? CurrentSkill { get; set; }

    public string? DraftStateJson { get; set; }
}
