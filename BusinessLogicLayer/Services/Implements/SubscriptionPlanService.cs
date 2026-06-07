using BusinessLogicLayer.DTOs.SubscriptionPlans;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.Entities;
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

        return plans.Select(MapProjection).ToList();
    }

    public async Task<List<SubscriptionPlanResponse>> GetPlansForAdminAsync()
    {
        var plans = await _unitOfWork.SubscriptionPlans.GetPlanProjectionsAsync();

        return plans.Select(MapProjection).ToList();
    }

    public async Task<SubscriptionPlanResponse> CreatePlanAsync(CreateSubscriptionPlanRequest request)
    {
        var name = NormalizeName(request.Name);

        if (await _unitOfWork.SubscriptionPlans.GetByNameAsync(name) is not null)
        {
            throw new InvalidOperationException("Subscription plan name already exists.");
        }

        var now = DateTime.UtcNow;
        var plan = new SubscriptionPlan
        {
            Name = name,
            Description = NormalizeDescription(request.Description),
            Price = request.Price,
            DurationDays = request.DurationDays,
            DailyPracticeLimit = request.DailyPracticeLimit,
            CanStoreSpeakingAudioForever = request.CanStoreSpeakingAudioForever,
            SpeakingAudioRetentionDays = request.SpeakingAudioRetentionDays,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _unitOfWork.SubscriptionPlans.AddAsync(plan);
        await _unitOfWork.SaveChangesAsync();

        return MapEntity(plan);
    }

    public async Task<SubscriptionPlanResponse> UpdatePlanAsync(int planId, UpdateSubscriptionPlanRequest request)
    {
        var plan = await _unitOfWork.SubscriptionPlans.GetTrackedByIdAsync(planId)
            ?? throw new KeyNotFoundException("Subscription plan not found.");

        var name = NormalizeName(request.Name);
        if (await _unitOfWork.SubscriptionPlans.ExistsByNameExceptIdAsync(name, planId))
        {
            throw new InvalidOperationException("Subscription plan name already exists.");
        }

        plan.Name = name;
        plan.Description = NormalizeDescription(request.Description);
        plan.Price = request.Price;
        plan.DurationDays = request.DurationDays;
        plan.DailyPracticeLimit = request.DailyPracticeLimit;
        plan.CanStoreSpeakingAudioForever = request.CanStoreSpeakingAudioForever;
        plan.SpeakingAudioRetentionDays = request.SpeakingAudioRetentionDays;
        plan.IsActive = request.IsActive;
        plan.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.SubscriptionPlans.Update(plan);
        await _unitOfWork.SaveChangesAsync();

        return MapEntity(plan);
    }

    public async Task DeletePlanAsync(int planId)
    {
        if (planId == 1)
        {
            throw new InvalidOperationException("Cannot deactivate the free plan.");
        }

        var plan = await _unitOfWork.SubscriptionPlans.GetTrackedByIdAsync(planId)
            ?? throw new KeyNotFoundException("Subscription plan not found.");

        plan.IsActive = false;
        plan.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.SubscriptionPlans.Update(plan);
        await _unitOfWork.SaveChangesAsync();
    }

    private static SubscriptionPlanResponse MapProjection(SubscriptionPlanProjection plan)
    {
        return new SubscriptionPlanResponse
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

    private static SubscriptionPlanResponse MapEntity(SubscriptionPlan plan)
    {
        return new SubscriptionPlanResponse
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

    private static string NormalizeName(string name)
    {
        var normalized = name.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new InvalidOperationException("Subscription plan name is required.");
        }

        return normalized;
    }

    private static string? NormalizeDescription(string? description)
    {
        var normalized = description?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}
