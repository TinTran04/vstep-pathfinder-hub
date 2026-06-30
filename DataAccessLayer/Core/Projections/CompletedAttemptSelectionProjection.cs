namespace DataAccessLayer.Core.Projections;

public class CompletedAttemptSelectionProjection
{
    public int ExamId { get; set; }

    public string? DraftStateJson { get; set; }
}
