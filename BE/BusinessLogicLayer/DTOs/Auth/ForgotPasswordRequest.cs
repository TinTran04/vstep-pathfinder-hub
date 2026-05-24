using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Auth;

public class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;
}
