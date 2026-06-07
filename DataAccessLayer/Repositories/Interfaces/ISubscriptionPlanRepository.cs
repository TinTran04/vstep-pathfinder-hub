using DataAccessLayer.Core.Projections;
using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface ISubscriptionPlanRepository
{
    Task<SubscriptionPlan?> GetByIdAsync(int planId);

    Task<SubscriptionPlan?> GetByNameAsync(string name);

    Task<List<SubscriptionPlan>> GetActivePlansAsync();

    Task<List<SubscriptionPlanProjection>> GetActivePlanProjectionsAsync();

    Task<List<SubscriptionPlanProjection>> GetPlanProjectionsAsync();

    Task<SubscriptionPlan?> GetTrackedByIdAsync(int planId);

    Task<bool> ExistsByNameExceptIdAsync(string name, int planId);

    Task AddAsync(SubscriptionPlan plan);

    void Update(SubscriptionPlan plan);
}
