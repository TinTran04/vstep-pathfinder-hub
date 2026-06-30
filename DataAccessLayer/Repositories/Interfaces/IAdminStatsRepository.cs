using DataAccessLayer.Core.Projections;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IAdminStatsRepository
{
    Task<AdminStatsSnapshotProjection> GetDashboardSnapshotAsync(DateTime nowUtc);
}
