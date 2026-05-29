using BusinessLogicLayer.DTOs.Payment;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IPaymentService
{
    Task<SubscriptionPaymentResponse> CreateSubscriptionPaymentAsync(int userId, CreateSubscriptionPaymentRequest request);

    Task HandlePayOsWebhookAsync(PayOsWebhookRequest request, string rawBody);
}
