using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class PaymentTransactionRepository : IPaymentTransactionRepository
{
    private readonly ApplicationDbContext _context;

    public PaymentTransactionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<PaymentTransaction?> GetByOrderCodeAsync(long orderCode)
    {
        return _context.PaymentTransactions
            .AsNoTracking()
            .Where(transaction => transaction.OrderCode == orderCode)
            .Select(transaction => new PaymentTransaction
            {
                PaymentTransactionId = transaction.PaymentTransactionId,
                UserId = transaction.UserId,
                SubscriptionPlanId = transaction.SubscriptionPlanId,
                OrderCode = transaction.OrderCode,
                Amount = transaction.Amount,
                Provider = transaction.Provider,
                Status = transaction.Status,
                Description = transaction.Description,
                PaymentLinkId = transaction.PaymentLinkId,
                CheckoutUrl = transaction.CheckoutUrl,
                QrCode = transaction.QrCode,
                PayosReference = transaction.PayosReference,
                PaidAt = transaction.PaidAt,
                CreatedAt = transaction.CreatedAt,
                UpdatedAt = transaction.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public Task<PaymentTransaction?> GetTrackedByOrderCodeAsync(long orderCode)
    {
        return _context.PaymentTransactions
            .FirstOrDefaultAsync(transaction => transaction.OrderCode == orderCode);
    }

    public Task AddAsync(PaymentTransaction transaction)
    {
        return _context.PaymentTransactions.AddAsync(transaction).AsTask();
    }
}
