using BusinessLogicLayer.DTOs.SubscriptionPlans;

namespace BusinessLogicLayer.Services.Interfaces;

public interface ISubscriptionPlanService
{
    Task<List<SubscriptionPlanResponse>> GetActivePlansAsync();
}
