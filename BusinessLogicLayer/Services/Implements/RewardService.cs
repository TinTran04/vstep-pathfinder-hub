using BusinessLogicLayer.DTOs.Dashboard;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class RewardService : IRewardService
{
    private const string LessonMode = "lesson";
    private const string CompleteLessonReward = "complete_lesson";
    private const string CompleteTestReward = "complete_test";
    private const string ScoreSevenPlusReward = "score_7_plus";
    private const string StreakSevenDaysReward = "streak_7_days";
    private const string ShareDashboardReward = "share_dashboard";
    private const string StreakSource = "streak";
    private const string ShareSource = "share";
    private const int CompleteLessonPoints = 10;
    private const int CompleteTestPoints = 25;
    private const int ScoreSevenPlusPoints = 15;
    private const int StreakSevenDaysPoints = 50;
    private const int ShareDashboardPoints = 30;
    private const int VietnamOffsetHours = 7;

    private readonly IUnitOfWork _unitOfWork;

    public RewardService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task AwardActivityRewardsAsync(int userId, string sourceType, int sourceId, string examMode, decimal? scoreOnTen)
    {
        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var completionReward = string.Equals(examMode, LessonMode, StringComparison.OrdinalIgnoreCase)
                ? CompleteLessonReward
                : CompleteTestReward;
            var completionPoints = completionReward == CompleteLessonReward
                ? CompleteLessonPoints
                : CompleteTestPoints;

            await AwardAsync(userId, completionReward, sourceType, sourceId, completionPoints);

            if (scoreOnTen >= 7)
            {
                await AwardAsync(userId, ScoreSevenPlusReward, sourceType, sourceId, ScoreSevenPlusPoints);
            }

            if (await GetCurrentStreakDaysAsync(userId) >= 7)
            {
                await AwardAsync(userId, StreakSevenDaysReward, StreakSource, 7, StreakSevenDaysPoints);
            }

            await _unitOfWork.SaveChangesAsync();
        });
    }

    public async Task<RewardPointsResponse> AwardShareRewardAsync(int userId)
    {
        var today = ToVietnamDate(DateTime.UtcNow);
        var sourceId = today.Year * 10000 + today.Month * 100 + today.Day;

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            await AwardAsync(userId, ShareDashboardReward, ShareSource, sourceId, ShareDashboardPoints);
            await _unitOfWork.SaveChangesAsync();
        });

        var rewardPoints = await _unitOfWork.Dashboard.GetRewardPointsAsync(userId);
        return new RewardPointsResponse { RewardPoints = rewardPoints };
    }

    private async Task AwardAsync(int userId, string rewardType, string sourceType, int? sourceId, int points)
    {
        if (await _unitOfWork.UserRewardLedgers.ExistsAsync(userId, rewardType, sourceType, sourceId))
        {
            return;
        }

        var user = await _unitOfWork.Users.GetTrackedByIdAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        await _unitOfWork.UserRewardLedgers.AddAsync(new UserRewardLedger
        {
            UserId = userId,
            RewardType = rewardType,
            SourceType = sourceType,
            SourceId = sourceId,
            Points = points
        });

        user.RewardPoints += points;
    }

    private async Task<int> GetCurrentStreakDaysAsync(int userId)
    {
        var today = ToVietnamDate(DateTime.UtcNow);
        var fromDate = today.AddDays(-30);
        var fromUtc = ToUtcFromVietnamDate(fromDate);
        var toUtc = ToUtcFromVietnamDate(today.AddDays(1));
        var activityDates = (await _unitOfWork.Dashboard.GetActivityDatesAsync(userId, fromUtc, toUtc)).ToHashSet();

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

    private static DateOnly ToVietnamDate(DateTime utcNow)
    {
        return DateOnly.FromDateTime(utcNow.AddHours(VietnamOffsetHours));
    }

    private static DateTime ToUtcFromVietnamDate(DateOnly vietnamDate)
    {
        return DateTime.SpecifyKind(
            vietnamDate.ToDateTime(TimeOnly.MinValue).AddHours(-VietnamOffsetHours),
            DateTimeKind.Utc);
    }
}
