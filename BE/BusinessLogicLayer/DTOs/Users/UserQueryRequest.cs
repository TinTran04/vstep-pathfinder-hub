using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Users;

public class UserQueryRequest
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 10;

    [MaxLength(255)]
    public string? Search { get; set; }

    public int? RoleId { get; set; }

    public int? SubscriptionPlanId { get; set; }

    public bool? EmailConfirmed { get; set; }
}
