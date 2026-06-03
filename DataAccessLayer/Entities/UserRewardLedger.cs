namespace DataAccessLayer.Entities;

public class UserRewardLedger
{
    public int UserRewardLedgerId { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public string RewardType { get; set; } = string.Empty;

    public string SourceType { get; set; } = string.Empty;

    public int? SourceId { get; set; }

    public int Points { get; set; }

    public DateTime CreatedAt { get; set; }
}
