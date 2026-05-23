namespace DataAccessLayer.Entities;

public class SubscriptionPlan
{
    public int SubscriptionPlanId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int DurationDays { get; set; }

    public int? DailyPracticeLimit { get; set; }

    public bool CanStoreSpeakingAudioForever { get; set; }

    public int SpeakingAudioRetentionDays { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
}
