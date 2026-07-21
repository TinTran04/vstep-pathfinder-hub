using System.Text.Json.Serialization;

namespace BusinessLogicLayer.DTOs.Admin;

public class AdminStatsResponse
{
    public List<UsageDataPoint> UsageData { get; set; } = new();
    public List<MonthlyUsagePoint> MonthlyUsageData { get; set; } = new();
    public List<SubscriptionPurchasePoint> SubscriptionPurchaseData { get; set; } = new();
    public List<PlanDistPoint> PlanDistData { get; set; } = new();
    public decimal TotalRevenue { get; set; }
    public decimal MonthlyGrowth { get; set; }
    public decimal UserGrowth { get; set; }
    public int ActiveStudents { get; set; }
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

public class PlanDistPoint
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Fill { get; set; } = string.Empty;
}

public class ActivityItem
{
    public string Text { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;

    [JsonIgnore]
    public DateTime CreatedAt { get; set; }
}
