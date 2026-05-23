using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Users;

public class UpdateUserRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int RoleId { get; set; }

    [Range(1, int.MaxValue)]
    public int SubscriptionPlanId { get; set; }

    public bool EmailConfirmed { get; set; }
}
