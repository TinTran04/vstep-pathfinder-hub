using DataAccessLayer.Context;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class AdminStatsRepository : IAdminStatsRepository
{
    private const string PaidStatus = "paid";
    private readonly ApplicationDbContext _context;

    public AdminStatsRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminStatsSnapshotProjection> GetDashboardSnapshotAsync(DateTime nowUtc)
    {
        var startOfToday = nowUtc.Date;
        var dailyFrom = startOfToday.AddDays(-6);
        var dailyTo = startOfToday.AddDays(1);
        var startOfThisMonth = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfLastMonth = startOfThisMonth.AddMonths(-1);
        var monthlyFrom = startOfThisMonth.AddMonths(-5);
        var recentLimit = 10;

        var totalStudents = await _context.Users
            .AsNoTracking()
            .Where(user => user.RoleId == 3 && !user.IsDeleted)
            .CountAsync();

        var totalAdmins = await _context.Users
            .AsNoTracking()
            .Where(user => user.RoleId == 1 && !user.IsDeleted)
            .CountAsync();

        var weeklyPlanStudents = await _context.Users
            .AsNoTracking()
            .Where(user => user.RoleId == 3 && !user.IsDeleted && user.SubscriptionPlanId == 2)
            .CountAsync();

        var monthlyPlanStudents = await _context.Users
            .AsNoTracking()
            .Where(user => user.RoleId == 3 && !user.IsDeleted && user.SubscriptionPlanId == 3)
            .CountAsync();

        var totalExams = await _context.Exams
            .AsNoTracking()
            .Where(exam => !exam.IsDeleted)
            .CountAsync();

        var activeExams = await _context.Exams
            .AsNoTracking()
            .Where(exam => !exam.IsDeleted && exam.IsPublished)
            .CountAsync();

        var draftExams = await _context.Exams
            .AsNoTracking()
            .Where(exam => !exam.IsDeleted && !exam.IsPublished)
            .CountAsync();

        var skillExamCounts = await _context.Exams
            .AsNoTracking()
            .Where(exam => !exam.IsDeleted)
            .GroupBy(exam => exam.SkillType)
            .Select(group => new AdminSkillExamCountProjection
            {
                SkillType = group.Key,
                Count = group.Count()
            })
            .ToListAsync();

        var topStudents = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt =>
                !attempt.IsDeleted &&
                (attempt.Status == "completed" || attempt.Status == "scored") &&
                attempt.User != null &&
                attempt.User.RoleId == 3 &&
                !attempt.User.IsDeleted)
            .GroupBy(attempt => new
            {
                attempt.UserId,
                attempt.User!.FullName,
                SubscriptionPlan = attempt.User.SubscriptionPlan.Name
            })
            .Select(group => new AdminTopStudentProjection
            {
                UserId = group.Key.UserId,
                FullName = group.Key.FullName,
                SubscriptionPlan = group.Key.SubscriptionPlan,
                CompletedAttempts = group.Count()
            })
            .OrderByDescending(student => student.CompletedAttempts)
            .ThenBy(student => student.FullName)
            .Take(5)
            .ToListAsync();

        var totalRevenue = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(payment => payment.Status == PaidStatus || payment.Status == "PAID")
            .SumAsync(payment => (decimal?)payment.Amount) ?? 0;

        var thisMonthRevenue = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(payment =>
                (payment.Status == PaidStatus || payment.Status == "PAID") &&
                payment.CreatedAt >= startOfThisMonth)
            .SumAsync(payment => (decimal?)payment.Amount) ?? 0;

        var lastMonthRevenue = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(payment =>
                (payment.Status == PaidStatus || payment.Status == "PAID") &&
                payment.CreatedAt >= startOfLastMonth &&
                payment.CreatedAt < startOfThisMonth)
            .SumAsync(payment => (decimal?)payment.Amount) ?? 0;

        var monthCounts = await _context.Users
            .AsNoTracking()
            .Where(user => user.RoleId == 3 && !user.IsDeleted && user.CreatedAt >= startOfLastMonth)
            .GroupBy(user => new { user.CreatedAt.Year, user.CreatedAt.Month })
            .Select(group => new AdminMonthlyUserProjection
            {
                Year = group.Key.Year,
                Month = group.Key.Month,
                Users = group.Count()
            })
            .ToListAsync();

        var dailyUsage = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt => !attempt.IsDeleted && attempt.StartedAt >= dailyFrom && attempt.StartedAt < dailyTo)
            .GroupBy(attempt => attempt.StartedAt.Date)
            .Select(group => new AdminDailyUsageProjection
            {
                Date = group.Key,
                Users = group.Select(attempt => attempt.UserId).Distinct().Count(),
                Exams = group.Count()
            })
            .ToListAsync();

        var todayAttempts = dailyUsage.FirstOrDefault(item => item.Date.Date == startOfToday)?.Exams ?? 0;
        var yesterdayAttempts = dailyUsage.FirstOrDefault(item => item.Date.Date == startOfToday.AddDays(-1))?.Exams ?? 0;

        var activeStudents = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt =>
                !attempt.IsDeleted &&
                attempt.StartedAt >= dailyFrom &&
                attempt.StartedAt < dailyTo &&
                attempt.User != null &&
                attempt.User.RoleId == 3 &&
                !attempt.User.IsDeleted)
            .Select(attempt => attempt.UserId)
            .Distinct()
            .CountAsync();

        var monthlyUsers = await _context.Users
            .AsNoTracking()
            .Where(user => user.RoleId == 3 && !user.IsDeleted && user.CreatedAt >= monthlyFrom)
            .GroupBy(user => new { user.CreatedAt.Year, user.CreatedAt.Month })
            .Select(group => new AdminMonthlyUserProjection
            {
                Year = group.Key.Year,
                Month = group.Key.Month,
                Users = group.Count()
            })
            .ToListAsync();

        var monthlyPurchases = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(payment =>
                (payment.Status == PaidStatus || payment.Status == "PAID") &&
                payment.CreatedAt >= monthlyFrom)
            .GroupBy(payment => new
            {
                payment.CreatedAt.Year,
                payment.CreatedAt.Month,
                payment.SubscriptionPlanId
            })
            .Select(group => new AdminMonthlyPurchaseProjection
            {
                Year = group.Key.Year,
                Month = group.Key.Month,
                SubscriptionPlanId = group.Key.SubscriptionPlanId,
                Count = group.Count()
            })
            .ToListAsync();

        var monthlyRevenue = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(payment =>
                (payment.Status == PaidStatus || payment.Status == "PAID") &&
                payment.CreatedAt >= monthlyFrom)
            .GroupBy(payment => new
            {
                payment.CreatedAt.Year,
                payment.CreatedAt.Month
            })
            .Select(group => new AdminMonthlyRevenueProjection
            {
                Year = group.Key.Year,
                Month = group.Key.Month,
                Revenue = group.Sum(payment => payment.Amount)
            })
            .ToListAsync();

        var planDistribution = await _context.Users
            .AsNoTracking()
            .GroupBy(user => user.SubscriptionPlanId)
            .Select(group => new AdminPlanDistributionProjection
            {
                SubscriptionPlanId = group.Key,
                Count = group.Count()
            })
            .ToListAsync();

        var recentAttempts = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt => attempt.Status == "scored" || attempt.Status == "completed")
            .OrderByDescending(attempt => attempt.CompletedAt ?? attempt.UpdatedAt ?? attempt.StartedAt)
            .Take(recentLimit)
            .Select(attempt => new AdminActivityProjection
            {
                Type = "exam",
                UserName = attempt.User != null ? attempt.User.FullName : "User",
                Subject = attempt.Exam != null ? attempt.Exam.Title : "Exam",
                Score = attempt.Score,
                CreatedAt = attempt.CompletedAt ?? attempt.UpdatedAt ?? attempt.StartedAt
            })
            .ToListAsync();

        var recentPayments = await _context.PaymentTransactions
            .AsNoTracking()
            .Where(payment => payment.Status == PaidStatus || payment.Status == "PAID")
            .OrderByDescending(payment => payment.CreatedAt)
            .Take(recentLimit)
            .Select(payment => new AdminActivityProjection
            {
                Type = "payment",
                UserName = payment.User != null ? payment.User.FullName : "User",
                Subject = payment.SubscriptionPlan != null ? payment.SubscriptionPlan.Name : "gói",
                CreatedAt = payment.CreatedAt
            })
            .ToListAsync();

        var recentUsers = await _context.Users
            .AsNoTracking()
            .OrderByDescending(user => user.CreatedAt)
            .Take(recentLimit)
            .Select(user => new AdminActivityProjection
            {
                Type = "user",
                UserName = user.FullName,
                CreatedAt = user.CreatedAt
            })
            .ToListAsync();

        return new AdminStatsSnapshotProjection
        {
            TotalRevenue = totalRevenue,
            ThisMonthRevenue = thisMonthRevenue,
            LastMonthRevenue = lastMonthRevenue,
            ThisMonthUsers = GetMonthCount(monthCounts, startOfThisMonth),
            LastMonthUsers = GetMonthCount(monthCounts, startOfLastMonth),
            ActiveStudents = activeStudents,
            TotalStudents = totalStudents,
            TotalAdmins = totalAdmins,
            WeeklyPlanStudents = weeklyPlanStudents,
            MonthlyPlanStudents = monthlyPlanStudents,
            TotalExams = totalExams,
            ActiveExams = activeExams,
            DraftExams = draftExams,
            TodayAttempts = todayAttempts,
            YesterdayAttempts = yesterdayAttempts,
            DailyUsage = dailyUsage,
            MonthlyUsers = monthlyUsers,
            MonthlyPurchases = monthlyPurchases,
            MonthlyRevenue = monthlyRevenue,
            PlanDistribution = planDistribution,
            SkillExamCounts = skillExamCounts,
            TopStudents = topStudents,
            RecentActivities = recentAttempts
                .Concat(recentPayments)
                .Concat(recentUsers)
                .OrderByDescending(activity => activity.CreatedAt)
                .Take(recentLimit)
                .ToList()
        };
    }

    private static int GetMonthCount(IEnumerable<AdminMonthlyUserProjection> counts, DateTime month)
    {
        return counts.FirstOrDefault(item => item.Year == month.Year && item.Month == month.Month)?.Users ?? 0;
    }
}
