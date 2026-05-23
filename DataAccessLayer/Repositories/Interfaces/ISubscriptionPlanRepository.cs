using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface ISubscriptionPlanRepository
{
    Task<SubscriptionPlan?> GetByIdAsync(int planId);

    Task<SubscriptionPlan?> GetByNameAsync(string name);

    Task<List<SubscriptionPlan>> GetActivePlansAsync();
}
