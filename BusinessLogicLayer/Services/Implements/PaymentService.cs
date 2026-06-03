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
    private const string CancelledStatus = "cancelled";
    private const string FailedStatus = "failed";
    private const int WeeklyPlanId = 2;
    private const int MonthlyPlanId = 3;

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

        EnsureUserCanUpgradeSubscription(user, DateTime.UtcNow);

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
            ItemName = plan.Name.ToLowerInvariant() switch
            {
                "monthly" => "VStepUp — Gói Học Tháng (30 ngày)",
                "weekly" => "VStepUp — Gói Học Tuần (7 ngày)",
                _ => $"VStepUp — {plan.Name}"
            }
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

    public async Task<ConfirmPayOsPaymentResponse> ConfirmPayOsPaymentAsync(int userId, ConfirmPayOsPaymentRequest request)
    {
        var existingTransaction = await _unitOfWork.PaymentTransactions.GetByOrderCodeAsync(request.OrderCode)
            ?? throw new KeyNotFoundException("Payment transaction not found.");
        if (existingTransaction.UserId != userId)
        {
            throw new UnauthorizedAccessException("Payment transaction does not belong to current user.");
        }

        PayOsPaymentLinkResult? paymentInfo = null;
        if (existingTransaction.Status != PaidStatus)
        {
            paymentInfo = await _payOsGateway.GetPaymentLinkAsync(request.OrderCode);
        }

        PaymentTransaction? confirmedTransaction = null;
        SubscriptionPlan? confirmedPlan = null;
        User? confirmedUser = null;

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var transaction = await _unitOfWork.PaymentTransactions.GetTrackedByOrderCodeAsync(request.OrderCode)
                ?? throw new KeyNotFoundException("Payment transaction not found.");

            if (transaction.UserId != userId)
            {
                throw new UnauthorizedAccessException("Payment transaction does not belong to current user.");
            }

            var plan = await _unitOfWork.SubscriptionPlans.GetByIdAsync(transaction.SubscriptionPlanId)
                ?? throw new KeyNotFoundException("Subscription plan not found.");
            var user = await _unitOfWork.Users.GetTrackedByIdAsync(transaction.UserId)
                ?? throw new KeyNotFoundException("User not found.");

            if (transaction.Status != PaidStatus)
            {
                if (paymentInfo is null)
                {
                    throw new InvalidOperationException("payOS payment information was not loaded.");
                }

                ValidateProviderPayment(transaction, paymentInfo);

                transaction.PaymentLinkId = paymentInfo.PaymentLinkId ?? transaction.PaymentLinkId;
                transaction.RawProviderPayload = paymentInfo.RawJson;

                var normalizedStatus = NormalizePayOsStatus(paymentInfo.Status);
                if (normalizedStatus == PaidStatus)
                {
                    EnsureUserCanUpgradeSubscription(user, DateTime.UtcNow);
                    CompletePaidTransaction(transaction, user, plan, DateTime.UtcNow, paymentInfo.Reference, paymentInfo.RawJson);
                }
                else if (normalizedStatus is CancelledStatus or FailedStatus)
                {
                    transaction.Status = normalizedStatus;
                }

                await _unitOfWork.SaveChangesAsync();
            }

            confirmedTransaction = transaction;
            confirmedPlan = plan;
            confirmedUser = user;
        });

        return MapConfirmResponse(
            confirmedTransaction ?? throw new InvalidOperationException("Payment confirmation failed."),
            confirmedPlan ?? throw new InvalidOperationException("Subscription plan could not be loaded."),
            confirmedUser ?? throw new InvalidOperationException("User could not be loaded."));
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
            var user = await _unitOfWork.Users.GetTrackedByIdAsync(transaction.UserId)
                ?? throw new KeyNotFoundException("User not found.");

            var paidAt = ParsePayOsDateTime(request.Data.TransactionDateTime) ?? DateTime.UtcNow;
            transaction.PaymentLinkId = request.Data.PaymentLinkId ?? transaction.PaymentLinkId;
            EnsureUserCanUpgradeSubscription(user, paidAt);
            CompletePaidTransaction(transaction, user, plan, paidAt, request.Data.Reference, rawBody);
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

    private static void EnsureUserCanUpgradeSubscription(User user, DateTime utcNow)
    {
        if (HasActivePaidSubscription(user, utcNow))
        {
            throw new InvalidOperationException("Bạn đang sở hữu gói tuần hoặc tháng còn hiệu lực nên không thể nâng cấp thêm.");
        }
    }

    private static bool HasActivePaidSubscription(User user, DateTime utcNow)
    {
        return user.SubscriptionPlanId is WeeklyPlanId or MonthlyPlanId &&
            (!user.SubscriptionExpiresAt.HasValue || user.SubscriptionExpiresAt.Value > utcNow);
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
            PaidAt = transaction.PaidAt,
            SubscriptionExpiresAt = transaction.User?.SubscriptionExpiresAt,
            CreatedAt = transaction.CreatedAt
        };
    }

    private static ConfirmPayOsPaymentResponse MapConfirmResponse(
        PaymentTransaction transaction,
        SubscriptionPlan plan,
        User user)
    {
        return new ConfirmPayOsPaymentResponse
        {
            PaymentTransactionId = transaction.PaymentTransactionId,
            OrderCode = transaction.OrderCode,
            Status = transaction.Status,
            SubscriptionPlanId = plan.SubscriptionPlanId,
            SubscriptionPlan = plan.Name,
            SubscriptionExpiresAt = user.SubscriptionExpiresAt,
            PaidAt = transaction.PaidAt
        };
    }

    private static void ValidateProviderPayment(PaymentTransaction transaction, PayOsPaymentLinkResult paymentInfo)
    {
        if (transaction.OrderCode != paymentInfo.OrderCode ||
            transaction.Amount != paymentInfo.Amount)
        {
            throw new InvalidOperationException("payOS payment data does not match transaction.");
        }

        if (!string.IsNullOrWhiteSpace(paymentInfo.Description) &&
            !string.Equals(transaction.Description, paymentInfo.Description, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("payOS payment description does not match transaction.");
        }

        if (!string.IsNullOrWhiteSpace(transaction.PaymentLinkId) &&
            !string.IsNullOrWhiteSpace(paymentInfo.PaymentLinkId) &&
            !string.Equals(transaction.PaymentLinkId, paymentInfo.PaymentLinkId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("payOS payment link does not match transaction.");
        }
    }

    private static void CompletePaidTransaction(
        PaymentTransaction transaction,
        User user,
        SubscriptionPlan plan,
        DateTime paidAt,
        string? providerReference,
        string rawPayload)
    {
        if (!plan.IsActive || plan.Price <= 0 || plan.DurationDays <= 0)
        {
            throw new InvalidOperationException("Subscription plan is not payable.");
        }

        var currentExpiry = user.SubscriptionExpiresAt.HasValue && user.SubscriptionExpiresAt.Value > paidAt
            ? user.SubscriptionExpiresAt.Value
            : paidAt;

        user.SubscriptionPlanId = plan.SubscriptionPlanId;
        user.SubscriptionExpiresAt = currentExpiry.AddDays(plan.DurationDays);

        transaction.Status = PaidStatus;
        transaction.PayosReference = providerReference;
        transaction.PaidAt = paidAt;
        transaction.RawProviderPayload = rawPayload;
    }

    private static string NormalizePayOsStatus(string status)
    {
        return status.Trim().ToUpperInvariant() switch
        {
            "PAID" => PaidStatus,
            "CANCELLED" or "CANCELED" or "EXPIRED" => CancelledStatus,
            "FAILED" => FailedStatus,
            _ => PendingStatus
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
