using DataAccessLayer.Context;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace DataAccessLayer.Repositories.Implements;

public class SubscriptionPlanRepository : ISubscriptionPlanRepository
{
    private readonly ApplicationDbContext _context;

    public SubscriptionPlanRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<SubscriptionPlan?> GetByIdAsync(int planId)
    {
        return _context.SubscriptionPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(plan => plan.SubscriptionPlanId == planId);
    }

    public Task<SubscriptionPlan?> GetByNameAsync(string name)
    {
        return _context.SubscriptionPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(plan => plan.Name == name);
    }

    public Task<List<SubscriptionPlan>> GetActivePlansAsync()
    {
        return _context.SubscriptionPlans
            .AsNoTracking()
            .Where(plan => plan.IsActive)
            .OrderBy(plan => plan.SubscriptionPlanId)
            .ToListAsync();
    }

    public Task<List<SubscriptionPlanProjection>> GetActivePlanProjectionsAsync()
    {
        return _context.SubscriptionPlans
            .AsNoTracking()
            .Where(plan => plan.IsActive)
            .OrderBy(plan => plan.SubscriptionPlanId)
            .Select(PlanProjection)
            .ToListAsync();
    }

    public Task<List<SubscriptionPlanProjection>> GetPlanProjectionsAsync()
    {
        return _context.SubscriptionPlans
            .AsNoTracking()
            .OrderBy(plan => plan.SubscriptionPlanId)
            .Select(PlanProjection)
            .ToListAsync();
    }

    public Task<SubscriptionPlan?> GetTrackedByIdAsync(int planId)
    {
        return _context.SubscriptionPlans
            .FirstOrDefaultAsync(plan => plan.SubscriptionPlanId == planId);
    }

    public Task<bool> ExistsByNameExceptIdAsync(string name, int planId)
    {
        return _context.SubscriptionPlans
            .AsNoTracking()
            .AnyAsync(plan => plan.Name == name && plan.SubscriptionPlanId != planId);
    }

    public Task AddAsync(SubscriptionPlan plan)
    {
        return _context.SubscriptionPlans.AddAsync(plan).AsTask();
    }

    public void Update(SubscriptionPlan plan)
    {
        _context.SubscriptionPlans.Update(plan);
    }

    private static readonly Expression<Func<SubscriptionPlan, SubscriptionPlanProjection>> PlanProjection =
        plan => new SubscriptionPlanProjection
        {
            SubscriptionPlanId = plan.SubscriptionPlanId,
            Name = plan.Name,
            Description = plan.Description,
            Price = plan.Price,
            DurationDays = plan.DurationDays,
            DailyPracticeLimit = plan.DailyPracticeLimit,
            CanStoreSpeakingAudioForever = plan.CanStoreSpeakingAudioForever,
            SpeakingAudioRetentionDays = plan.SpeakingAudioRetentionDays,
            IsActive = plan.IsActive
        };
}
