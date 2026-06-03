using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class UserRewardLedgerRepository : IUserRewardLedgerRepository
{
    private readonly ApplicationDbContext _context;

    public UserRewardLedgerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<bool> ExistsAsync(int userId, string rewardType, string sourceType, int? sourceId)
    {
        return _context.UserRewardLedgers
            .AsNoTracking()
            .AnyAsync(ledger =>
                ledger.UserId == userId &&
                ledger.RewardType == rewardType &&
                ledger.SourceType == sourceType &&
                ledger.SourceId == sourceId);
    }

    public Task AddAsync(UserRewardLedger ledger)
    {
        return _context.UserRewardLedgers.AddAsync(ledger).AsTask();
    }
}
