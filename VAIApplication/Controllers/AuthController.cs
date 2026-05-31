using BusinessLogicLayer.DTOs.Auth;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Dang ky tai khoan moi va gui OTP xac thuc email.
    /// </summary>
    /// <param name="request">Thong tin dang ky tai khoan.</param>
    /// <returns>Thong tin tai khoan vua dang ky, chua cap token cho den khi xac thuc email.</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _authService.RegisterAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<AuthResponse>.Ok(response, "Register successfully. Please verify your email OTP."));
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Xac thuc OTP email sau khi dang ky tai khoan.
    /// </summary>
    /// <param name="request">Email va ma OTP gom 6 chu so.</param>
    /// <returns>Thong tin dang nhap kem access token va refresh token neu OTP hop le.</returns>
    [HttpPost("verify-otp")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _authService.VerifyOtpAsync(request);
            return Ok(ApiResponse<AuthResponse>.Ok(response, "Email verified successfully."));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(ApiResponse<object>.Fail(exception.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Gui lai OTP xac thuc email cho tai khoan chua kich hoat.
    /// </summary>
    /// <param name="request">Email can gui lai OTP.</param>
    /// <returns>Thong bao ket qua gui OTP.</returns>
    [HttpPost("resend-otp")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            await _authService.ResendOtpAsync(request);
            var response = new MessageResponse { Message = "OTP sent successfully." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(ApiResponse<object>.Fail(exception.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Dang nhap bang email va mat khau cho tai khoan da xac thuc email.
    /// </summary>
    /// <param name="request">Email va mat khau dang nhap.</param>
    /// <returns>Access token, refresh token va thong tin tai khoan.</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(ApiResponse<AuthResponse>.Ok(response, "Login successfully."));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Lam moi access token bang refresh token con hieu luc.
    /// </summary>
    /// <param name="request">Refresh token da duoc cap truoc do.</param>
    /// <returns>Access token va refresh token moi.</returns>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _authService.RefreshTokenAsync(request);
            return Ok(ApiResponse<AuthResponse>.Ok(response, "Refresh token successfully."));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Dang xuat bang cach thu hoi refresh token hien tai.
    /// </summary>
    /// <param name="request">Refresh token can thu hoi.</param>
    /// <returns>Thong bao dang xuat thanh cong.</returns>
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        await _authService.LogoutAsync(request);
        var response = new MessageResponse { Message = "Logout successfully." };
        return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
    }

    /// <summary>
    /// Thay đổi mật khẩu tài khoản cho người dùng đang đăng nhập.
    /// </summary>
    /// <param name="request">Thông tin mật khẩu hiện tại và mật khẩu mới.</param>
    /// <returns>Thông báo đổi mật khẩu thành công.</returns>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Yêu cầu không hợp lệ.", GetModelStateErrors()));
        }

        try
        {
            var userId = GetUserId();
            await _authService.ChangePasswordAsync(userId, request);
            var response = new MessageResponse { Message = "Đổi mật khẩu thành công." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Yêu cầu gửi mã OTP quên mật khẩu về email.
    /// </summary>
    /// <param name="request">Email cần lấy lại mật khẩu.</param>
    /// <returns>Thông báo đã gửi mã OTP thành công.</returns>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Yêu cầu không hợp lệ.", GetModelStateErrors()));
        }

        try
        {
            await _authService.ForgotPasswordAsync(request);
            var response = new MessageResponse { Message = "Mã OTP đã được gửi về email của bạn." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Xác nhận mã OTP đặt lại mật khẩu mà không thực hiện đổi mật khẩu ngay.
    /// </summary>
    /// <param name="request">Email và mã OTP cần xác thực.</param>
    /// <returns>Thông báo xác thực mã OTP thành công.</returns>
    [HttpPost("verify-reset-otp")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> VerifyResetOtp([FromBody] VerifyOtpRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Yêu cầu không hợp lệ.", GetModelStateErrors()));
        }

        try
        {
            await _authService.VerifyResetOtpAsync(request);
            var response = new MessageResponse { Message = "Xác thực mã OTP thành công." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Xác nhận OTP và thiết lập lại mật khẩu mới.
    /// </summary>
    /// <param name="request">Email, mã OTP và mật khẩu mới.</param>
    /// <returns>Thông báo đặt lại mật khẩu thành công.</returns>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Yêu cầu không hợp lệ.", GetModelStateErrors()));
        }

        try
        {
            await _authService.ResetPasswordAsync(request);
            var response = new MessageResponse { Message = "Đặt lại mật khẩu thành công." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(ApiResponse<object>.Fail(exception.Message));
        }
    }

    private int GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var parsedUserId)
            ? parsedUserId
            : throw new UnauthorizedAccessException("Invalid user token.");
    }

    private Dictionary<string, string[]> GetModelStateErrors()
    {
        return ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .ToDictionary(
                entry => entry.Key,
                entry => entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray());
    }
}
