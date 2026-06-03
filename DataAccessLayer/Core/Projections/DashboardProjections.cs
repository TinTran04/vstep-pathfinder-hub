namespace DataAccessLayer.Core.Projections;

public class CompletedCountsProjection
{
    public int CompletedCount { get; set; }

    public int CompletedLessons { get; set; }

    public int CompletedTests { get; set; }
}

public class RecentResultProjection
{
    public int Id { get; set; }

    public string SourceType { get; set; } = string.Empty;

    public int? ExamId { get; set; }

    public string ExamTitle { get; set; } = string.Empty;

    public string SkillType { get; set; } = string.Empty;

    public string ExamMode { get; set; } = string.Empty;

    public decimal? Score { get; set; }

    public decimal? ScoreOnTen { get; set; }

    public string Status { get; set; } = string.Empty;

    public int? DurationUsedSeconds { get; set; }

    public DateTime CompletedAt { get; set; }
}

public class SkillProgressProjection
{
    public string SkillType { get; set; } = string.Empty;

    public decimal? AverageScoreOnTen { get; set; }

    public int CompletedCount { get; set; }
}
