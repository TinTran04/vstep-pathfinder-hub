using BusinessLogicLayer.DTOs.Admin;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class AdminStatsService : IAdminStatsService
{
    private const int FreePlanId = 1;
    private const int WeeklyPlanId = 2;
    private const int MonthlyPlanId = 3;
    private readonly IUnitOfWork _unitOfWork;

    public AdminStatsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<AdminStatsResponse> GetDashboardStatsAsync()
    {
        var nowUtc = DateTime.UtcNow;
        var snapshot = await _unitOfWork.AdminStats.GetDashboardSnapshotAsync(nowUtc);
        var startOfToday = nowUtc.Date;
        var startOfThisMonth = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var monthlyGrowth = snapshot.LastMonthRevenue > 0
            ? (snapshot.ThisMonthRevenue - snapshot.LastMonthRevenue) / snapshot.LastMonthRevenue * 100
            : snapshot.ThisMonthRevenue > 0 ? 100 : 0;

        var userGrowth = snapshot.LastMonthUsers > 0
            ? (snapshot.ThisMonthUsers - snapshot.LastMonthUsers) / (decimal)snapshot.LastMonthUsers * 100
            : snapshot.ThisMonthUsers > 0 ? 100 : 0;

        var usageData = Enumerable.Range(0, 7)
            .Select(offset => startOfToday.AddDays(offset - 6))
            .Select(date =>
            {
                var value = snapshot.DailyUsage.FirstOrDefault(item => item.Date.Date == date);
                return new UsageDataPoint
                {
                    Name = date.ToString("dd/MM"),
                    Users = value?.Users ?? 0,
                    Exams = value?.Exams ?? 0
                };
            })
            .ToList();

        var monthStarts = Enumerable.Range(0, 6)
            .Select(offset => startOfThisMonth.AddMonths(offset - 5))
            .ToList();

        var monthlyUsage = monthStarts.Select(month => new MonthlyUsagePoint
        {
            Name = month.ToString("MMM"),
            Users = snapshot.MonthlyUsers
                .FirstOrDefault(item => item.Year == month.Year && item.Month == month.Month)?.Users ?? 0
        }).ToList();

        var subscriptionPurchases = monthStarts.Select(month => new SubscriptionPurchasePoint
        {
            Month = month.ToString("MMM"),
            Free = 0,
            Weekly = GetPurchaseCount(snapshot.MonthlyPurchases, month, WeeklyPlanId),
            Monthly = GetPurchaseCount(snapshot.MonthlyPurchases, month, MonthlyPlanId)
        }).ToList();

        return new AdminStatsResponse
        {
            UsageData = usageData,
            MonthlyUsageData = monthlyUsage,
            SubscriptionPurchaseData = subscriptionPurchases,
            PlanDistData = snapshot.PlanDistribution
                .Where(item => item.Count > 0)
                .Select(MapPlanDistribution)
                .ToList(),
            TotalRevenue = snapshot.ThisMonthRevenue,
            MonthlyGrowth = Math.Round(monthlyGrowth, 1),
            UserGrowth = Math.Round(userGrowth, 1),
            ActiveStudents = snapshot.ActiveStudents,
            RecentActivities = snapshot.RecentActivities.Select(MapActivity).ToList(),
            WeeklyData = usageData.Select(item => item.Exams).ToList()
        };
    }

    private static int GetPurchaseCount(
        IEnumerable<AdminMonthlyPurchaseProjection> purchases,
        DateTime month,
        int planId)
    {
        return purchases.FirstOrDefault(item =>
            item.Year == month.Year &&
            item.Month == month.Month &&
            item.SubscriptionPlanId == planId)?.Count ?? 0;
    }

    private static PlanDistPoint MapPlanDistribution(AdminPlanDistributionProjection item)
    {
        return item.SubscriptionPlanId switch
        {
            FreePlanId => new PlanDistPoint { Name = "Free", Value = item.Count, Fill = "#ef4444" },
            WeeklyPlanId => new PlanDistPoint { Name = "Weekly", Value = item.Count, Fill = "#f59e0b" },
            MonthlyPlanId => new PlanDistPoint { Name = "Monthly", Value = item.Count, Fill = "#10b981" },
            _ => new PlanDistPoint { Name = $"Plan {item.SubscriptionPlanId}", Value = item.Count, Fill = "#64748b" }
        };
    }

    private static ActivityItem MapActivity(AdminActivityProjection activity)
    {
        var text = activity.Type switch
        {
            "exam" => $"{activity.UserName} hoàn thành bài thi {activity.Subject ?? "Exam"} - {activity.Score}/10",
            "payment" => $"{activity.UserName} đăng ký {activity.Subject ?? "gói"}",
            _ => $"{activity.UserName} đăng ký tài khoản mới"
        };

        return new ActivityItem
        {
            Text = text,
            Type = activity.Type,
            Time = GetRelativeTime(activity.CreatedAt),
            CreatedAt = activity.CreatedAt
        };
    }

    private static string GetRelativeTime(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime;
        if (span.TotalMinutes < 1) return "Vừa xong";
        if (span.TotalHours < 1) return $"{(int)span.TotalMinutes} phút trước";
        if (span.TotalDays < 1) return $"{(int)span.TotalHours} giờ trước";
        if (span.TotalDays < 30) return $"{(int)span.TotalDays} ngày trước";
        return dateTime.ToString("dd/MM/yyyy");
    }
}
