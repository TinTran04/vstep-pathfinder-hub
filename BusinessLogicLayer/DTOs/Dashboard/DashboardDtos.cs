namespace BusinessLogicLayer.DTOs.Dashboard;

public class DashboardResponse
{
    public int WeekStudySeconds { get; set; }

    public int CompletedCount { get; set; }

    public int CompletedLessons { get; set; }

    public int CompletedTests { get; set; }

    public int RewardPoints { get; set; }

    public int CurrentStreakDays { get; set; }

    public List<StreakDayResponse> StreakDays { get; set; } = new();

    public List<RecentResultResponse> RecentResults { get; set; } = new();

    public SkillProgressResponse SkillProgress { get; set; } = new();
}

public class StreakDayResponse
{
    public DateOnly Date { get; set; }

    public bool HasActivity { get; set; }
}

public class RecentResultResponse
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

public class SkillProgressResponse
{
    public SkillProgressItemResponse Listening { get; set; } = new()
    {
        SkillType = "listening",
        Label = "Listening"
    };

    public SkillProgressItemResponse Reading { get; set; } = new()
    {
        SkillType = "reading",
        Label = "Reading"
    };

    public SkillProgressItemResponse Writing { get; set; } = new()
    {
        SkillType = "writing",
        Label = "Writing"
    };

    public SkillProgressItemResponse Speaking { get; set; } = new()
    {
        SkillType = "speaking",
        Label = "Speaking"
    };
}

public class SkillProgressItemResponse
{
    public string SkillType { get; set; } = string.Empty;

    public decimal? AverageScoreOnTen { get; set; }

    public int CompletedCount { get; set; }

    public string Label { get; set; } = string.Empty;
}

public class RewardPointsResponse
{
    public int RewardPoints { get; set; }
}
