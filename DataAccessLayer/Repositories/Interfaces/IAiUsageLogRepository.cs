using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IAiUsageLogRepository
{
    Task AddAsync(AiUsageLog log);
}
