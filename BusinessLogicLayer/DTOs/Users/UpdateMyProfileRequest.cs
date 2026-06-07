using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Users;

public class UpdateMyProfileRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string AvatarKey { get; set; } = "avatar1";
}
