using BusinessLogicLayer.DTOs.Dashboard;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class DashboardService : IDashboardService
{
    private const int VietnamOffsetHours = 7;
    private const int RecentResultLimit = 10;
    private const int StreakDisplayDays = 14;

    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardResponse> GetMyDashboardAsync(int userId)
    {
        _ = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        var utcNow = DateTime.UtcNow;
        var todayVn = ToVietnamDate(utcNow);
        var vnNow = utcNow.AddHours(VietnamOffsetHours);
        var startOfWeekVn = vnNow.Date.AddDays(-GetMondayOffset(vnNow.DayOfWeek));
        var weekStartUtc = startOfWeekVn.AddHours(-VietnamOffsetHours);
        var weekEndUtc = weekStartUtc.AddDays(7);

        var activityFromDate = todayVn.AddDays(-30);
        var activityFromUtc = activityFromDate.ToDateTime(TimeOnly.MinValue).AddHours(-VietnamOffsetHours);
        var activityToUtc = todayVn.AddDays(1).ToDateTime(TimeOnly.MinValue).AddHours(-VietnamOffsetHours);

        var weekStudySeconds = await _unitOfWork.Dashboard.GetWeekStudySecondsAsync(userId, weekStartUtc, weekEndUtc);
        var completedCounts = await _unitOfWork.Dashboard.GetCompletedCountsAsync(userId);
        var rewardPoints = await _unitOfWork.Dashboard.GetRewardPointsAsync(userId);
        var activityDates = (await _unitOfWork.Dashboard.GetActivityDatesAsync(userId, activityFromUtc, activityToUtc)).ToHashSet();
        var recentResults = await _unitOfWork.Dashboard.GetRecentResultsAsync(userId, RecentResultLimit);
        var skillProgress = await _unitOfWork.Dashboard.GetSkillProgressAsync(userId);

        return new DashboardResponse
        {
            WeekStudySeconds = weekStudySeconds,
            CompletedCount = completedCounts.CompletedCount,
            CompletedLessons = completedCounts.CompletedLessons,
            CompletedTests = completedCounts.CompletedTests,
            RewardPoints = rewardPoints,
            CurrentStreakDays = CalculateCurrentStreakDays(todayVn, activityDates),
            StreakDays = BuildStreakDays(todayVn, activityDates),
            RecentResults = recentResults.Select(MapRecentResult).ToList(),
            SkillProgress = MapSkillProgress(skillProgress)
        };
    }

    private static int CalculateCurrentStreakDays(DateOnly today, IReadOnlySet<DateOnly> activityDates)
    {
        var cursor = activityDates.Contains(today)
            ? today
            : activityDates.Contains(today.AddDays(-1))
                ? today.AddDays(-1)
                : default;

        if (cursor == default)
        {
            return 0;
        }

        var streak = 0;
        while (activityDates.Contains(cursor))
        {
            streak++;
            cursor = cursor.AddDays(-1);
        }

        return streak;
    }

    private static List<StreakDayResponse> BuildStreakDays(DateOnly today, IReadOnlySet<DateOnly> activityDates)
    {
        return Enumerable.Range(0, StreakDisplayDays)
            .Select(offset => today.AddDays(-(StreakDisplayDays - 1 - offset)))
            .Select(date => new StreakDayResponse
            {
                Date = date,
                HasActivity = activityDates.Contains(date)
            })
            .ToList();
    }

    private static RecentResultResponse MapRecentResult(RecentResultProjection result)
    {
        return new RecentResultResponse
        {
            Id = result.Id,
            SourceType = result.SourceType,
            ExamId = result.ExamId,
            ExamTitle = result.ExamTitle,
            SkillType = result.SkillType,
            ExamMode = result.ExamMode,
            Score = result.Score,
            ScoreOnTen = result.ScoreOnTen.HasValue ? decimal.Round(result.ScoreOnTen.Value, 2) : null,
            Status = result.Status,
            DurationUsedSeconds = result.DurationUsedSeconds,
            CompletedAt = result.CompletedAt
        };
    }

    private static SkillProgressResponse MapSkillProgress(List<SkillProgressProjection> projections)
    {
        var bySkill = projections.ToDictionary(
            projection => projection.SkillType,
            projection => projection,
            StringComparer.OrdinalIgnoreCase);

        return new SkillProgressResponse
        {
            Listening = MapSkillProgressItem(bySkill, "listening", "Listening"),
            Reading = MapSkillProgressItem(bySkill, "reading", "Reading"),
            Writing = MapSkillProgressItem(bySkill, "writing", "Writing"),
            Speaking = MapSkillProgressItem(bySkill, "speaking", "Speaking")
        };
    }

    private static SkillProgressItemResponse MapSkillProgressItem(
        IReadOnlyDictionary<string, SkillProgressProjection> bySkill,
        string skillType,
        string label)
    {
        return bySkill.TryGetValue(skillType, out var progress)
            ? new SkillProgressItemResponse
            {
                SkillType = skillType,
                Label = label,
                AverageScoreOnTen = progress.AverageScoreOnTen,
                CompletedCount = progress.CompletedCount
            }
            : new SkillProgressItemResponse
            {
                SkillType = skillType,
                Label = label
            };
    }

    private static DateOnly ToVietnamDate(DateTime utcNow)
    {
        return DateOnly.FromDateTime(utcNow.AddHours(VietnamOffsetHours));
    }

    private static int GetMondayOffset(DayOfWeek dayOfWeek)
    {
        return ((int)dayOfWeek + 6) % 7;
    }
}
