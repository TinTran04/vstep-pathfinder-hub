using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BusinessLogicLayer.DTOs.Payment;

public class CreateSubscriptionPaymentRequest
{
    [Range(1, int.MaxValue)]
    public int SubscriptionPlanId { get; set; }
}

public class SubscriptionPaymentResponse
{
    public int PaymentTransactionId { get; set; }

    public long OrderCode { get; set; }

    public int SubscriptionPlanId { get; set; }

    public string SubscriptionPlan { get; set; } = string.Empty;

    public int Amount { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? PaymentLinkId { get; set; }

    public string CheckoutUrl { get; set; } = string.Empty;

    public string? QrCode { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class PayOsWebhookRequest
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;

    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    public PayOsWebhookData Data { get; set; } = new();

    [JsonPropertyName("signature")]
    public string Signature { get; set; } = string.Empty;
}

public class PayOsWebhookData
{
    [JsonPropertyName("orderCode")]
    public long OrderCode { get; set; }

    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("accountNumber")]
    public string? AccountNumber { get; set; }

    [JsonPropertyName("reference")]
    public string? Reference { get; set; }

    [JsonPropertyName("transactionDateTime")]
    public string? TransactionDateTime { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = string.Empty;

    [JsonPropertyName("paymentLinkId")]
    public string? PaymentLinkId { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;
}
