using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Users;

public class CreateUserRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int RoleId { get; set; }

    [Range(1, int.MaxValue)]
    public int SubscriptionPlanId { get; set; }

    public bool EmailConfirmed { get; set; }
}
