using System.Net.Http.Json;
using System.Text.Json.Serialization;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements;

public class PayOsGateway : IPayOsGateway
{
    private readonly HttpClient _httpClient;
    private readonly PayOsSettings _settings;

    public PayOsGateway(HttpClient httpClient, IOptions<PayOsSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public async Task<PayOsCreatePaymentResult> CreatePaymentLinkAsync(PayOsCreatePaymentCommand command)
    {
        EnsureConfigured();

        var signature = PayOsSignatureHelper.CreateSignature(new Dictionary<string, string>
        {
            ["amount"] = command.Amount.ToString(),
            ["cancelUrl"] = _settings.CancelUrl,
            ["description"] = command.Description,
            ["orderCode"] = command.OrderCode.ToString(),
            ["returnUrl"] = _settings.ReturnUrl
        }, _settings.ChecksumKey);

        var payload = new PayOsCreatePaymentRequest
        {
            OrderCode = command.OrderCode,
            Amount = command.Amount,
            Description = command.Description,
            BuyerName = command.BuyerName,
            BuyerEmail = command.BuyerEmail,
            CancelUrl = _settings.CancelUrl,
            ReturnUrl = _settings.ReturnUrl,
            Signature = signature,
            Items = new List<PayOsItemRequest>
            {
                new()
                {
                    Name = command.ItemName,
                    Quantity = 1,
                    Price = command.Amount
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "v2/payment-requests")
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Add("x-client-id", _settings.ClientId);
        request.Headers.Add("x-api-key", _settings.ApiKey);

        using var response = await _httpClient.SendAsync(request);
        var result = await response.Content.ReadFromJsonAsync<PayOsCreatePaymentResponse>();

        if (!response.IsSuccessStatusCode || result is null || result.Code != "00" || result.Data is null)
        {
            throw new InvalidOperationException(result?.Desc ?? "payOS create payment link failed.");
        }

        return new PayOsCreatePaymentResult
        {
            PaymentLinkId = result.Data.PaymentLinkId,
            CheckoutUrl = result.Data.CheckoutUrl,
            QrCode = result.Data.QrCode
        };
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_settings.ClientId) ||
            string.IsNullOrWhiteSpace(_settings.ApiKey) ||
            string.IsNullOrWhiteSpace(_settings.ChecksumKey) ||
            string.IsNullOrWhiteSpace(_settings.ReturnUrl) ||
            string.IsNullOrWhiteSpace(_settings.CancelUrl))
        {
            throw new InvalidOperationException("payOS settings are not configured.");
        }
    }

    private sealed class PayOsCreatePaymentRequest
    {
        [JsonPropertyName("orderCode")]
        public long OrderCode { get; set; }

        [JsonPropertyName("amount")]
        public int Amount { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("buyerName")]
        public string BuyerName { get; set; } = string.Empty;

        [JsonPropertyName("buyerEmail")]
        public string BuyerEmail { get; set; } = string.Empty;

        [JsonPropertyName("items")]
        public List<PayOsItemRequest> Items { get; set; } = new();

        [JsonPropertyName("cancelUrl")]
        public string CancelUrl { get; set; } = string.Empty;

        [JsonPropertyName("returnUrl")]
        public string ReturnUrl { get; set; } = string.Empty;

        [JsonPropertyName("signature")]
        public string Signature { get; set; } = string.Empty;
    }

    private sealed class PayOsItemRequest
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; }

        [JsonPropertyName("price")]
        public int Price { get; set; }
    }

    private sealed class PayOsCreatePaymentResponse
    {
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonPropertyName("desc")]
        public string Desc { get; set; } = string.Empty;

        [JsonPropertyName("data")]
        public PayOsCreatePaymentData? Data { get; set; }
    }

    private sealed class PayOsCreatePaymentData
    {
        [JsonPropertyName("paymentLinkId")]
        public string? PaymentLinkId { get; set; }

        [JsonPropertyName("checkoutUrl")]
        public string CheckoutUrl { get; set; } = string.Empty;

        [JsonPropertyName("qrCode")]
        public string? QrCode { get; set; }
    }
}

public class PayOsCreatePaymentCommand
{
    public long OrderCode { get; set; }

    public int Amount { get; set; }

    public string Description { get; set; } = string.Empty;

    public string BuyerName { get; set; } = string.Empty;

    public string BuyerEmail { get; set; } = string.Empty;

    public string ItemName { get; set; } = string.Empty;
}

public class PayOsCreatePaymentResult
{
    public string? PaymentLinkId { get; set; }

    public string CheckoutUrl { get; set; } = string.Empty;

    public string? QrCode { get; set; }
}
