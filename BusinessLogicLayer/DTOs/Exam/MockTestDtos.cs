namespace BusinessLogicLayer.DTOs.Exam;

public class InProgressAttemptResponse
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? DurationMinutes { get; set; }
    public DateTime ServerNow { get; set; } = DateTime.UtcNow;
    public int RemainingSeconds { get; set; }
    public string? CurrentSkill { get; set; }
    public string? DraftStateJson { get; set; }
    public Dictionary<string, int>? SkillDurations { get; set; }
    public ExamDetailResponse Exam { get; set; } = default!;
}

public class AttemptProgressResponse
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime ServerNow { get; set; }
    public int RemainingSeconds { get; set; }
}

public class AutosaveRequest
{
    public string? CurrentSkill { get; set; }
    public string? DraftStateJson { get; set; }
    public DateTime? ClientUpdatedAt { get; set; }
}

public class SubmitMockTestRequest
{
    public string? DraftStateJson { get; set; }
}

public class MockTestPayload
{
    public string? CurrentSkill { get; set; }
    public MockTestSkillState? Listening { get; set; }
    public MockTestSkillState? Reading { get; set; }
    public Dictionary<string, string>? Writing { get; set; }
    public MockTestSpeakingState? Speaking { get; set; }
}

public class MockTestSkillState
{
    public Dictionary<int, string>? Answers { get; set; }
}

public class MockTestSpeakingState
{
    public List<MockTestSpeakingAnswer>? Answers { get; set; }
}

public class MockTestSpeakingAnswer
{
    public int QuestionId { get; set; }
    public int? PartNumber { get; set; }
    public string? AudioObjectKey { get; set; }
    public string? AudioUrl { get; set; }
    public string? Transcript { get; set; }
    public string? Status { get; set; }
}

public class StartRandomMockTestResponse
{
    public int AttemptId { get; set; }
    public string Mode { get; set; } = "random_mock_test";
    public Dictionary<string, int> SelectedExamIds { get; set; } = new();
    public DateTime StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int DurationMinutes { get; set; }
}

public class HistoryItemResponse
{
    public int AttemptId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal? OverallScore { get; set; }
    public Dictionary<string, decimal?> SkillScores { get; set; } = new();
    public string? CurrentSkill { get; set; }
    public int RemainingSeconds { get; set; }
}

public class HistoryPagedResponse
{
    public List<HistoryItemResponse> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}
