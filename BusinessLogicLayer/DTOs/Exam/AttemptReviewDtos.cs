using BusinessLogicLayer.DTOs.Speaking;
using BusinessLogicLayer.DTOs.Writing;

namespace BusinessLogicLayer.DTOs.Exam;

public class AttemptReviewResponse
{
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public int UserId { get; set; }
    public string SkillType { get; set; } = string.Empty;
    public string ExamTitle { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? TotalScore { get; set; }
    public decimal? OverallScore { get; set; }
    public int? TotalQuestions { get; set; }
    public int? CorrectCount { get; set; }
    public int? DurationUsedSeconds { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public List<SectionReviewResponse> Sections { get; set; } = new();

    public WritingReviewResponse? WritingReview { get; set; }
    public SpeakingReviewResponse? SpeakingReview { get; set; }
    public List<SpeakingReviewResponse> SpeakingReviews { get; set; } = new();
}

public class SectionReviewResponse : SectionResponse
{
    public new List<QuestionReviewResponse> Questions { get; set; } = new();
}

public class QuestionReviewResponse : QuestionResponse
{
    public string UserAnswer { get; set; } = string.Empty;
    public bool IsCorrectAnswer { get; set; }
}

public class WritingReviewResponse
{
    public int WritingSubmissionId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string EssayText { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? Score { get; set; }
    public int? DurationUsedSeconds { get; set; }
    public string? Feedback { get; set; }
    public string? FeedbackJson { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SpeakingReviewResponse
{
    public int SpeakingSubmissionId { get; set; }
    public int? PartNumber { get; set; }
    public string AudioUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal? Score { get; set; }
    public int? DurationUsedSeconds { get; set; }
    public string? Feedback { get; set; }
    public string? FeedbackJson { get; set; }
    public string? Transcript { get; set; }
    public DateTime CreatedAt { get; set; }
}
