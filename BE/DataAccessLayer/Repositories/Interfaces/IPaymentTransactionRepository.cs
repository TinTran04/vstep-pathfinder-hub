using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IPaymentTransactionRepository
{
    Task<PaymentTransaction?> GetByOrderCodeAsync(long orderCode);

    Task<PaymentTransaction?> GetTrackedByOrderCodeAsync(long orderCode);

    Task AddAsync(PaymentTransaction transaction);
}
