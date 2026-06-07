namespace DataAccessLayer.Core.Projections;

public class SubscriptionPlanProjection
{
    public int SubscriptionPlanId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int DurationDays { get; set; }

    public int? DailyPracticeLimit { get; set; }

    public bool CanStoreSpeakingAudioForever { get; set; }

    public int SpeakingAudioRetentionDays { get; set; }
}
