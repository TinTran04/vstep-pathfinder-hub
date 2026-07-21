namespace BusinessLogicLayer.DTOs.Users;

public class UserListItemResponse
{
    public int UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string AvatarKey { get; set; } = "avatar1";

    public int RoleId { get; set; }

    public string Role { get; set; } = string.Empty;

    public int SubscriptionPlanId { get; set; }

    public string SubscriptionPlan { get; set; } = string.Empty;

    public DateTime? SubscriptionExpiresAt { get; set; }

    public bool EmailConfirmed { get; set; }

    public int ExamsCompleted { get; set; }

    public DateTime CreatedAt { get; set; }
}
