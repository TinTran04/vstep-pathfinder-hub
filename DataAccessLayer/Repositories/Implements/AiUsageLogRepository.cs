using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;

namespace DataAccessLayer.Repositories.Implements;

public class AiUsageLogRepository : IAiUsageLogRepository
{
    private readonly ApplicationDbContext _context;

    public AiUsageLogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AiUsageLog log)
    {
        await _context.AiUsageLogs.AddAsync(log);
    }
}
