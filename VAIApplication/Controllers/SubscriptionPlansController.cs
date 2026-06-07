using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.SubscriptionPlans;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
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

    /// <summary>
    /// Lay tat ca goi subscription cho admin, bao gom goi da an.
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<List<SubscriptionPlanResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPlansForAdmin()
    {
        var response = await _subscriptionPlanService.GetPlansForAdminAsync();
        return Ok(ApiResponse<List<SubscriptionPlanResponse>>.Ok(response, "Get subscription plans successfully."));
    }

    /// <summary>
    /// Tao goi subscription moi bang tai khoan admin.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<SubscriptionPlanResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreatePlan([FromBody] CreateSubscriptionPlanRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _subscriptionPlanService.CreatePlanAsync(request);
            return CreatedAtAction(nameof(GetPlansForAdmin), ApiResponse<SubscriptionPlanResponse>.Ok(response, "Create subscription plan successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Cap nhat goi subscription bang tai khoan admin.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<SubscriptionPlanResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdatePlan(int id, [FromBody] UpdateSubscriptionPlanRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _subscriptionPlanService.UpdatePlanAsync(id, request);
            return Ok(ApiResponse<SubscriptionPlanResponse>.Ok(response, "Update subscription plan successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// An goi subscription khoi danh sach public bang tai khoan admin.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeletePlan(int id)
    {
        try
        {
            await _subscriptionPlanService.DeletePlanAsync(id);
            var response = new MessageResponse { Message = "Delete subscription plan successfully." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    private Dictionary<string, string[]> GetModelStateErrors()
    {
        return ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .ToDictionary(
                entry => entry.Key,
                entry => entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray());
    }
}
