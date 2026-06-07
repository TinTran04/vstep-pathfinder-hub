using BusinessLogicLayer.DTOs.SubscriptionPlans;

namespace BusinessLogicLayer.Services.Interfaces;

public interface ISubscriptionPlanService
{
    Task<List<SubscriptionPlanResponse>> GetActivePlansAsync();

    Task<List<SubscriptionPlanResponse>> GetPlansForAdminAsync();

    Task<SubscriptionPlanResponse> CreatePlanAsync(CreateSubscriptionPlanRequest request);

    Task<SubscriptionPlanResponse> UpdatePlanAsync(int planId, UpdateSubscriptionPlanRequest request);

    Task DeletePlanAsync(int planId);
}
