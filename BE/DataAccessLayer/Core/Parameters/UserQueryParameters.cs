namespace DataAccessLayer.Core.Parameters;

public class UserQueryParameters
{
    public int PageNumber { get; set; } = 1;

    public int PageSize { get; set; } = 10;

    public string? Search { get; set; }

    public int? RoleId { get; set; }

    public int? SubscriptionPlanId { get; set; }

    public bool? EmailConfirmed { get; set; }
}
