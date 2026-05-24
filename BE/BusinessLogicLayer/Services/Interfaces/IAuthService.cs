using BusinessLogicLayer.DTOs.Auth;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);

    Task<AuthResponse> LoginAsync(LoginRequest request);

    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);

    Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request);

    Task ResendOtpAsync(ResendOtpRequest request);

    Task LogoutAsync(LogoutRequest request);

    Task ChangePasswordAsync(int userId, ChangePasswordRequest request);

    Task ForgotPasswordAsync(ForgotPasswordRequest request);

    Task VerifyResetOtpAsync(VerifyOtpRequest request);

    Task ResetPasswordAsync(ResetPasswordRequest request);
}
