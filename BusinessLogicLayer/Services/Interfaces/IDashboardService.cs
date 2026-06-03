using BusinessLogicLayer.DTOs.Dashboard;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardResponse> GetMyDashboardAsync(int userId);
}
