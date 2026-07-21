namespace DataAccessLayer.Core.Projections;

public class ExamAttemptProgressProjection
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
}
