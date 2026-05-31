using System.Text.Json;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.DTOs.Payment;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements;

public class PaymentService : IPaymentService
{
    private const string Provider = "payos";
    private const string PendingStatus = "pending";
    private const string PaidStatus = "paid";

    private readonly IUnitOfWork _unitOfWork;
    private readonly IPayOsGateway _payOsGateway;
    private readonly PayOsSettings _settings;

    public PaymentService(IUnitOfWork unitOfWork, IPayOsGateway payOsGateway, IOptions<PayOsSettings> options)
    {
        _unitOfWork = unitOfWork;
        _payOsGateway = payOsGateway;
        _settings = options.Value;
    }

    public async Task<SubscriptionPaymentResponse> CreateSubscriptionPaymentAsync(int userId, CreateSubscriptionPaymentRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");
        var plan = await _unitOfWork.SubscriptionPlans.GetByIdAsync(request.SubscriptionPlanId)
            ?? throw new KeyNotFoundException("Subscription plan not found.");

        if (!plan.IsActive)
        {
            throw new InvalidOperationException("Subscription plan is inactive.");
        }

        if (plan.SubscriptionPlanId == 1 || plan.Price <= 0 || plan.DurationDays <= 0)
        {
            throw new InvalidOperationException("This subscription plan does not require payment.");
        }

        var amount = checked((int)plan.Price);
        var orderCode = CreateOrderCode();
        var description = $"VAI{orderCode % 1000000000:D9}";
        var gatewayResult = await _payOsGateway.CreatePaymentLinkAsync(new PayOsCreatePaymentCommand
        {
            OrderCode = orderCode,
            Amount = amount,
            Description = description,
            BuyerName = user.FullName,
            BuyerEmail = user.Email,
            ItemName = $"VAI {plan.Name}"
        });

        var transaction = new PaymentTransaction
        {
            UserId = userId,
            SubscriptionPlanId = plan.SubscriptionPlanId,
            OrderCode = orderCode,
            Amount = amount,
            Provider = Provider,
            Status = PendingStatus,
            Description = description,
            PaymentLinkId = gatewayResult.PaymentLinkId,
            CheckoutUrl = gatewayResult.CheckoutUrl,
            QrCode = gatewayResult.QrCode
        };

        await _unitOfWork.PaymentTransactions.AddAsync(transaction);
        await _unitOfWork.SaveChangesAsync();

        transaction.SubscriptionPlan = plan;
        return MapResponse(transaction);
    }

    public async Task HandlePayOsWebhookAsync(PayOsWebhookRequest request, string rawBody)
    {
        if (!request.Success || request.Code != "00" || request.Data.Code != "00")
        {
            return;
        }

        VerifyWebhookSignature(rawBody);

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var transaction = await _unitOfWork.PaymentTransactions.GetTrackedByOrderCodeAsync(request.Data.OrderCode)
                ?? throw new KeyNotFoundException("Payment transaction not found.");

            if (transaction.Status == PaidStatus)
            {
                return;
            }

            if (transaction.Provider != Provider ||
                transaction.Amount != request.Data.Amount ||
                !string.Equals(transaction.Description, request.Data.Description, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Payment webhook data does not match transaction.");
            }

            var plan = await _unitOfWork.SubscriptionPlans.GetByIdAsync(transaction.SubscriptionPlanId)
                ?? throw new KeyNotFoundException("Subscription plan not found.");
            if (!plan.IsActive || plan.Price <= 0 || plan.DurationDays <= 0)
            {
                throw new InvalidOperationException("Subscription plan is not payable.");
            }

            var user = await _unitOfWork.Users.GetTrackedByIdAsync(transaction.UserId)
                ?? throw new KeyNotFoundException("User not found.");

            var paidAt = ParsePayOsDateTime(request.Data.TransactionDateTime) ?? DateTime.UtcNow;
            var currentExpiry = user.SubscriptionExpiresAt.HasValue && user.SubscriptionExpiresAt.Value > paidAt
                ? user.SubscriptionExpiresAt.Value
                : paidAt;

            user.SubscriptionPlanId = plan.SubscriptionPlanId;
            user.SubscriptionExpiresAt = currentExpiry.AddDays(plan.DurationDays);

            transaction.Status = PaidStatus;
            transaction.PaymentLinkId = request.Data.PaymentLinkId ?? transaction.PaymentLinkId;
            transaction.PayosReference = request.Data.Reference;
            transaction.PaidAt = paidAt;
            transaction.RawWebhookPayload = rawBody;

            await _unitOfWork.SaveChangesAsync();
        });
    }

    private void VerifyWebhookSignature(string rawBody)
    {
        if (string.IsNullOrWhiteSpace(_settings.ChecksumKey))
        {
            throw new InvalidOperationException("payOS checksum key is not configured.");
        }

        using var document = JsonDocument.Parse(rawBody);
        var root = document.RootElement;
        var data = root.GetProperty("data");
        var signature = root.GetProperty("signature").GetString();
        var expectedSignature = PayOsSignatureHelper.CreateSignature(data, _settings.ChecksumKey);

        if (!string.Equals(signature, expectedSignature, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Invalid payOS webhook signature.");
        }
    }

    private static SubscriptionPaymentResponse MapResponse(PaymentTransaction transaction)
    {
        return new SubscriptionPaymentResponse
        {
            PaymentTransactionId = transaction.PaymentTransactionId,
            OrderCode = transaction.OrderCode,
            SubscriptionPlanId = transaction.SubscriptionPlanId,
            SubscriptionPlan = transaction.SubscriptionPlan.Name,
            Amount = transaction.Amount,
            Status = transaction.Status,
            PaymentLinkId = transaction.PaymentLinkId,
            CheckoutUrl = transaction.CheckoutUrl ?? string.Empty,
            QrCode = transaction.QrCode,
            CreatedAt = transaction.CreatedAt
        };
    }

    private static long CreateOrderCode()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 100000000000;
        var random = Random.Shared.Next(100, 999);
        return timestamp * 1000 + random;
    }

    private static DateTime? ParsePayOsDateTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return DateTime.TryParse(value, out var parsed)
            ? DateTime.SpecifyKind(parsed, DateTimeKind.Utc)
            : null;
    }
}
