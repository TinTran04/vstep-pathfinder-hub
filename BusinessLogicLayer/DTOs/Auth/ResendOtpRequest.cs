using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Auth;

public class ResendOtpRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
}
