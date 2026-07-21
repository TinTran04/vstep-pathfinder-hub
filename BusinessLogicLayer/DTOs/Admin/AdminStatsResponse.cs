using System.Text.Json.Serialization;

namespace BusinessLogicLayer.DTOs.Admin;

public class AdminStatsResponse
{
    public List<UsageDataPoint> UsageData { get; set; } = new();
    public List<MonthlyUsagePoint> MonthlyUsageData { get; set; } = new();
    public List<SubscriptionPurchasePoint> SubscriptionPurchaseData { get; set; } = new();
    public List<MonthlyRevenuePoint> MonthlyRevenueData { get; set; } = new();
    public List<PlanDistPoint> PlanDistData { get; set; } = new();
    public List<SkillExamCountPoint> SkillExamCounts { get; set; } = new();
    public List<TopStudentPoint> TopStudents { get; set; } = new();
    public decimal TotalRevenue { get; set; }
    public decimal MonthlyGrowth { get; set; }
    public decimal UserGrowth { get; set; }
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
    public List<ActivityItem> RecentActivities { get; set; } = new();
    public List<int> WeeklyData { get; set; } = new();
}

public class UsageDataPoint
{
    public string Name { get; set; } = string.Empty;
    public int Users { get; set; }
    public int Exams { get; set; }
}

public class MonthlyUsagePoint
{
    public string Name { get; set; } = string.Empty;
    public int Users { get; set; }
}

public class SubscriptionPurchasePoint
{
    public string Month { get; set; } = string.Empty;
    public int Free { get; set; }
    public int Weekly { get; set; }
    public int Monthly { get; set; }
}

public class MonthlyRevenuePoint
{
    public string Month { get; set; } = string.Empty;
    public int Year { get; set; }
    public int MonthNumber { get; set; }
    public decimal Revenue { get; set; }
}

public class PlanDistPoint
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Fill { get; set; } = string.Empty;
}

public class SkillExamCountPoint
{
    public string Skill { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TopStudentPoint
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string SubscriptionPlan { get; set; } = string.Empty;
    public int CompletedAttempts { get; set; }
}

public class ActivityItem
{
    public string Text { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;

    [JsonIgnore]
    public DateTime CreatedAt { get; set; }
}
