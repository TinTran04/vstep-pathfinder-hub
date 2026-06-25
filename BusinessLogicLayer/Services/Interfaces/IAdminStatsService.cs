using BusinessLogicLayer.DTOs.Admin;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IAdminStatsService
{
    Task<AdminStatsResponse> GetDashboardStatsAsync();
}
