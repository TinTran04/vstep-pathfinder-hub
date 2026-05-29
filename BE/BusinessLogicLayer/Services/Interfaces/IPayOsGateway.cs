using BusinessLogicLayer.Services.Implements;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IPayOsGateway
{
    Task<PayOsCreatePaymentResult> CreatePaymentLinkAsync(PayOsCreatePaymentCommand command);
}
