using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

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
}
