namespace DataAccessLayer.Entities;

public class PaymentTransaction
{
    public int PaymentTransactionId { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public int SubscriptionPlanId { get; set; }

    public SubscriptionPlan SubscriptionPlan { get; set; } = null!;

    public long OrderCode { get; set; }

    public int Amount { get; set; }

    public string Provider { get; set; } = "payos";

    public string Status { get; set; } = "pending";

    public string Description { get; set; } = string.Empty;

    public string? PaymentLinkId { get; set; }

    public string? CheckoutUrl { get; set; }

    public string? QrCode { get; set; }

    public string? PayosReference { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? RawWebhookPayload { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
