namespace DataAccessLayer.Core.Projections;

public class AdminStatsSnapshotProjection
{
    public decimal TotalRevenue { get; set; }

    public decimal ThisMonthRevenue { get; set; }

    public decimal LastMonthRevenue { get; set; }

    public int ThisMonthUsers { get; set; }

    public int LastMonthUsers { get; set; }

    public int ActiveStudents { get; set; }

    public int TotalStudents { get; set; }

    public int TotalAdmins { get; set; }

    public int WeeklyPlanStudents { get; set; }

    public int MonthlyPlanStudents { get; set; }

    public int TotalExams { get; set; }

    public int ActiveExams { get; set; }

    public int DraftExams { get; set; }

    public int TodayAttempts { get; set; }

    public int YesterdayAttempts { get; set; }

    public List<AdminDailyUsageProjection> DailyUsage { get; set; } = new();

    public List<AdminMonthlyUserProjection> MonthlyUsers { get; set; } = new();

    public List<AdminMonthlyPurchaseProjection> MonthlyPurchases { get; set; } = new();

    public List<AdminMonthlyRevenueProjection> MonthlyRevenue { get; set; } = new();

    public List<AdminPlanDistributionProjection> PlanDistribution { get; set; } = new();

    public List<AdminSkillExamCountProjection> SkillExamCounts { get; set; } = new();

    public List<AdminTopStudentProjection> TopStudents { get; set; } = new();

    public List<AdminActivityProjection> RecentActivities { get; set; } = new();
}

public class AdminDailyUsageProjection
{
    public DateTime Date { get; set; }

    public int Users { get; set; }

    public int Exams { get; set; }
}

public class AdminMonthlyUserProjection
{
    public int Year { get; set; }

    public int Month { get; set; }

    public int Users { get; set; }
}

public class AdminMonthlyPurchaseProjection
{
    public int Year { get; set; }

    public int Month { get; set; }

    public int SubscriptionPlanId { get; set; }

    public int Count { get; set; }
}

public class AdminMonthlyRevenueProjection
{
    public int Year { get; set; }

    public int Month { get; set; }

    public decimal Revenue { get; set; }
}

public class AdminPlanDistributionProjection
{
    public int SubscriptionPlanId { get; set; }

    public int Count { get; set; }
}

public class AdminSkillExamCountProjection
{
    public string SkillType { get; set; } = string.Empty;

    public int Count { get; set; }
}

public class AdminTopStudentProjection
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string SubscriptionPlan { get; set; } = string.Empty;

    public int CompletedAttempts { get; set; }
}

public class AdminActivityProjection
{
    public string Type { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string? Subject { get; set; }

    public decimal? Score { get; set; }

    public DateTime CreatedAt { get; set; }
}
