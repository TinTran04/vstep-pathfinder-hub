using System.Security.Claims;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Dashboard;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly IRewardService _rewardService;

    public DashboardController(IDashboardService dashboardService, IRewardService rewardService)
    {
        _dashboardService = dashboardService;
        _rewardService = rewardService;
    }

    /// <summary>
    /// Lấy dữ liệu tổng hợp cho màn hình Dashboard học tập của người dùng hiện tại.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<DashboardResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetMyDashboard()
    {
        try
        {
            var response = await _dashboardService.GetMyDashboardAsync(GetUserId());
            return Ok(ApiResponse<DashboardResponse>.Ok(response, "Lấy dữ liệu dashboard thành công."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Cộng điểm thưởng khi người dùng chia sẻ dashboard, tối đa một lần mỗi ngày.
    /// </summary>
    [HttpPost("rewards/share")]
    [ProducesResponseType(typeof(ApiResponse<RewardPointsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ShareDashboard()
    {
        try
        {
            var response = await _rewardService.AwardShareRewardAsync(GetUserId());
            return Ok(ApiResponse<RewardPointsResponse>.Ok(response, "Ghi nhận điểm thưởng chia sẻ thành công."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    private int GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var parsedUserId)
            ? parsedUserId
            : throw new UnauthorizedAccessException("Token người dùng không hợp lệ.");
    }
}
