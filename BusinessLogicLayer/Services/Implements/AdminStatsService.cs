using BusinessLogicLayer.DTOs.Admin;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Context;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogicLayer.Services.Implements;

public class AdminStatsService : IAdminStatsService
{
    private readonly ApplicationDbContext _dbContext;

    public AdminStatsService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AdminStatsResponse> GetDashboardStatsAsync()
    {
        var now = DateTime.UtcNow;
        var startOfToday = now.Date;
        var startOfThisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfLastMonth = startOfThisMonth.AddMonths(-1);

        var totalRevenue = await _dbContext.PaymentTransactions
            .Where(p => p.Status == "paid" || p.Status == "PAID")
            .SumAsync(p => p.Amount);

        var thisMonthUsers = await _dbContext.Users
            .Where(u => u.CreatedAt >= startOfThisMonth)
            .CountAsync();

        var lastMonthUsers = await _dbContext.Users
            .Where(u => u.CreatedAt >= startOfLastMonth && u.CreatedAt < startOfThisMonth)
            .CountAsync();

        decimal monthlyGrowth = 0;
        if (lastMonthUsers > 0)
        {
            monthlyGrowth = (thisMonthUsers - lastMonthUsers) / (decimal)lastMonthUsers * 100;
        }
        else if (thisMonthUsers > 0)
        {
            monthlyGrowth = 100;
        }

        var weeklyData = new List<int>();
        var usageData = new List<UsageDataPoint>();
        for (int i = 6; i >= 0; i--)
        {
            var date = startOfToday.AddDays(-i);
            var nextDate = date.AddDays(1);

            var activeUsers = await _dbContext.ExamAttempts
                .Where(a => a.StartedAt >= date && a.StartedAt < nextDate)
                .Select(a => a.UserId)
                .Distinct()
                .CountAsync();

            var examsTaken = await _dbContext.ExamAttempts
                .Where(a => a.StartedAt >= date && a.StartedAt < nextDate)
                .CountAsync();

            weeklyData.Add(examsTaken);
            usageData.Add(new UsageDataPoint
            {
                Name = date.ToString("dd/MM"),
                Users = activeUsers,
                Exams = examsTaken
            });
        }

        var monthlyUsageData = new List<MonthlyUsagePoint>();
        var subscriptionPurchaseData = new List<SubscriptionPurchasePoint>();
        for (int i = 5; i >= 0; i--)
        {
            var startOfMonth = startOfThisMonth.AddMonths(-i);
            var endOfMonth = startOfMonth.AddMonths(1);
            var monthName = startOfMonth.ToString("MMM");

            var usersCreated = await _dbContext.Users
                .Where(u => u.CreatedAt >= startOfMonth && u.CreatedAt < endOfMonth)
                .CountAsync();

            monthlyUsageData.Add(new MonthlyUsagePoint
            {
                Name = monthName,
                Users = usersCreated
            });

            var basic = await _dbContext.PaymentTransactions
                .Where(p => (p.Status == "paid" || p.Status == "PAID") && p.SubscriptionPlanId == 2 && p.CreatedAt >= startOfMonth && p.CreatedAt < endOfMonth)
                .CountAsync();
            var pro = await _dbContext.PaymentTransactions
                .Where(p => (p.Status == "paid" || p.Status == "PAID") && p.SubscriptionPlanId == 3 && p.CreatedAt >= startOfMonth && p.CreatedAt < endOfMonth)
                .CountAsync();

            subscriptionPurchaseData.Add(new SubscriptionPurchasePoint
            {
                Month = monthName,
                Free = 0,
                Weekly = basic,
                Monthly = pro
            });
        }

        var planDistData = new List<PlanDistPoint>
        {
            new PlanDistPoint { Name = "Free", Value = await _dbContext.Users.Where(u => u.SubscriptionPlanId == 1).CountAsync(), Fill = "#ef4444" },
            new PlanDistPoint { Name = "Weekly", Value = await _dbContext.Users.Where(u => u.SubscriptionPlanId == 2).CountAsync(), Fill = "#f59e0b" },
            new PlanDistPoint { Name = "Monthly", Value = await _dbContext.Users.Where(u => u.SubscriptionPlanId == 3).CountAsync(), Fill = "#10b981" }
        };

        var recentActivities = new List<ActivityItem>();
        
        var recentAttempts = await _dbContext.ExamAttempts
            .Include(a => a.User)
            .Include(a => a.Exam)
            .Where(a => a.Status == "scored" || a.Status == "completed")
            .OrderByDescending(a => a.CompletedAt)
            .Take(10)
            .ToListAsync();
            
        foreach(var a in recentAttempts)
        {
            recentActivities.Add(new ActivityItem
            {
                Text = $"{a.User?.FullName ?? "User"} hoàn thành bài thi {a.Exam?.Title ?? "Exam"} — {a.Score}/10",
                Type = "exam",
                Time = GetRelativeTime(a.CompletedAt ?? a.UpdatedAt ?? DateTime.UtcNow),
                CreatedAt = a.CompletedAt ?? a.UpdatedAt ?? DateTime.UtcNow
            });
        }

        var recentPayments = await _dbContext.PaymentTransactions
            .Include(p => p.User)
            .Include(p => p.SubscriptionPlan)
            .Where(p => p.Status == "paid" || p.Status == "PAID")
            .OrderByDescending(p => p.CreatedAt)
            .Take(10)
            .ToListAsync();

        foreach(var p in recentPayments)
        {
            recentActivities.Add(new ActivityItem
            {
                Text = $"{p.User?.FullName ?? "User"} đăng ký {p.SubscriptionPlan?.Name ?? "gói"}",
                Type = "payment",
                Time = GetRelativeTime(p.CreatedAt),
                CreatedAt = p.CreatedAt
            });
        }
        
        var recentUsers = await _dbContext.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(10)
            .ToListAsync();
            
        foreach(var u in recentUsers)
        {
            recentActivities.Add(new ActivityItem
            {
                Text = $"{u.FullName} đăng ký tài khoản mới",
                Type = "user",
                Time = GetRelativeTime(u.CreatedAt),
                CreatedAt = u.CreatedAt
            });
        }

        recentActivities = recentActivities
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .ToList();

        return new AdminStatsResponse
        {
            UsageData = usageData,
            MonthlyUsageData = monthlyUsageData,
            SubscriptionPurchaseData = subscriptionPurchaseData,
            PlanDistData = planDistData.Where(p => p.Value > 0).ToList(),
            TotalRevenue = totalRevenue,
            MonthlyGrowth = Math.Round(monthlyGrowth, 1),
            RecentActivities = recentActivities,
            WeeklyData = weeklyData
        };
    }

    private string GetRelativeTime(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime;
        if (span.TotalMinutes < 1) return "Vừa xong";
        if (span.TotalHours < 1) return $"{(int)span.TotalMinutes} phút trước";
        if (span.TotalDays < 1) return $"{(int)span.TotalHours} giờ trước";
        if (span.TotalDays < 30) return $"{(int)span.TotalDays} ngày trước";
        return dateTime.ToString("dd/MM/yyyy");
    }
}
