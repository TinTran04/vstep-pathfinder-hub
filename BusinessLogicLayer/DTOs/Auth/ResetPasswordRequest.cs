using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Auth;

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "Email là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã OTP là bắt buộc.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Mã OTP phải gồm 6 chữ số.")]
    public string Otp { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới là bắt buộc.")]
    [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")]
    [MaxLength(100, ErrorMessage = "Mật khẩu mới không được vượt quá 100 ký tự.")]
    public string NewPassword { get; set; } = string.Empty;
}
