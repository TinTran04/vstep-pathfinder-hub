namespace BusinessLogicLayer.DTOs.Exam;

public class StartPracticeRequest
{
}

public class StartPracticeResponse
{
    public int AttemptId { get; set; }

    public int ExamId { get; set; }

    public string SkillType { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; }

    public ExamDetailResponse Exam { get; set; } = new();
}

public class SubmitPracticeResponse
{
    public int AttemptId { get; set; }

    public string Status { get; set; } = string.Empty;

    public decimal Score { get; set; }

    public int TotalQuestions { get; set; }

    public int CorrectCount { get; set; }

    public DateTime? SubmittedAt { get; set; }
}

public class AttemptResultResponse
{
    public int AttemptId { get; set; }

    public int ExamId { get; set; }

    public string SkillType { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal? Score { get; set; }

    public int? TotalQuestions { get; set; }

    public int? CorrectCount { get; set; }

    public int? DurationUsedSeconds { get; set; }

    public DateTime StartedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public List<AttemptAnswerResponse> Answers { get; set; } = new();
}

public class AttemptAnswerResponse
{
    public int AnswerId { get; set; }

    public int QuestionId { get; set; }

    public string UserAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public decimal Score { get; set; }
}
