using DataAccessLayer.Core.Projections;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IDashboardRepository
{
    Task<int> GetRewardPointsAsync(int userId);

    Task<int> GetWeekStudySecondsAsync(int userId, DateTime weekStartUtc, DateTime weekEndUtc);

    Task<CompletedCountsProjection> GetCompletedCountsAsync(int userId);

    Task<List<DateOnly>> GetActivityDatesAsync(int userId, DateTime fromUtc, DateTime toUtc);

    Task<List<RecentResultProjection>> GetRecentResultsAsync(int userId, int limit);

    Task<List<SkillProgressProjection>> GetSkillProgressAsync(int userId);
}
