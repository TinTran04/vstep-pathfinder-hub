using BusinessLogicLayer.DTOs.SubscriptionPlans;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class SubscriptionPlanService : ISubscriptionPlanService
{
    private readonly IUnitOfWork _unitOfWork;

    public SubscriptionPlanService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<SubscriptionPlanResponse>> GetActivePlansAsync()
    {
        var plans = await _unitOfWork.SubscriptionPlans.GetActivePlanProjectionsAsync();

        return plans.Select(plan => new SubscriptionPlanResponse
        {
            SubscriptionPlanId = plan.SubscriptionPlanId,
            Name = plan.Name,
            Description = plan.Description,
            Price = plan.Price,
            DurationDays = plan.DurationDays,
            DailyPracticeLimit = plan.DailyPracticeLimit,
            CanStoreSpeakingAudioForever = plan.CanStoreSpeakingAudioForever,
            SpeakingAudioRetentionDays = plan.SpeakingAudioRetentionDays
        }).ToList();
    }
}
