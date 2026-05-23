namespace DataAccessLayer.Entities;

public class User
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public int RoleId { get; set; } = 3;

    public Role Role { get; set; } = null!;

    public int SubscriptionPlanId { get; set; } = 1;

    public SubscriptionPlan SubscriptionPlan { get; set; } = null!;

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiryTime { get; set; }

    public bool EmailConfirmed { get; set; }

    public string? EmailOtpHash { get; set; }

    public DateTime? EmailOtpExpiryTime { get; set; }

    public int OtpFailedCount { get; set; }

    public DateTime? OtpLastSentAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<ExamAttempt> ExamAttempts { get; set; } = new List<ExamAttempt>();

    public ICollection<WritingSubmission> WritingSubmissions { get; set; } = new List<WritingSubmission>();

    public ICollection<SpeakingSubmission> SpeakingSubmissions { get; set; } = new List<SpeakingSubmission>();
}
