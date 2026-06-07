using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.SubscriptionPlans;

public class CreateSubscriptionPlanRequest
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int DurationDays { get; set; }

    [Range(0, int.MaxValue)]
    public int? DailyPracticeLimit { get; set; }

    public bool CanStoreSpeakingAudioForever { get; set; }

    [Range(0, int.MaxValue)]
    public int SpeakingAudioRetentionDays { get; set; }

    public bool IsActive { get; set; } = true;
}
