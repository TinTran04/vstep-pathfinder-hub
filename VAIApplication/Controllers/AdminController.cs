using BusinessLogicLayer.DTOs.Admin;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminStatsService _adminStatsService;

    public AdminController(IAdminStatsService adminStatsService)
    {
        _adminStatsService = adminStatsService;
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<AdminStatsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _adminStatsService.GetDashboardStatsAsync();
        return Ok(ApiResponse<AdminStatsResponse>.Ok(stats, "Admin dashboard stats retrieved successfully."));
    }
}
