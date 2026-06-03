using BusinessLogicLayer.DTOs.Dashboard;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IRewardService
{
    Task AwardActivityRewardsAsync(int userId, string sourceType, int sourceId, string examMode, decimal? scoreOnTen);

    Task<RewardPointsResponse> AwardShareRewardAsync(int userId);
}
