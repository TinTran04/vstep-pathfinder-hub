using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.SubscriptionPlans;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/subscription-plans")]
public class SubscriptionPlansController : ControllerBase
{
    private readonly ISubscriptionPlanService _subscriptionPlanService;

    public SubscriptionPlansController(ISubscriptionPlanService subscriptionPlanService)
    {
        _subscriptionPlanService = subscriptionPlanService;
    }

    /// <summary>
    /// Lay danh sach goi subscription dang active tu database.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<SubscriptionPlanResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetActivePlans()
    {
        var response = await _subscriptionPlanService.GetActivePlansAsync();
        return Ok(ApiResponse<List<SubscriptionPlanResponse>>.Ok(response, "Get subscription plans successfully."));
    }
}
