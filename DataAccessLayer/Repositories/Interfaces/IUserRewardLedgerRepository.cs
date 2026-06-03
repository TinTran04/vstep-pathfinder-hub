using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IUserRewardLedgerRepository
{
    Task<bool> ExistsAsync(int userId, string rewardType, string sourceType, int? sourceId);

    Task AddAsync(UserRewardLedger ledger);
}
