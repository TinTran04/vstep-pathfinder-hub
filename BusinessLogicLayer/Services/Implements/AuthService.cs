using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.DTOs.Auth;
using BusinessLogicLayer.Integrations.Email;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BusinessLogicLayer.Services.Implements;

public class AuthService : IAuthService
{
    private const int DefaultRoleId = 3;
    private const int DefaultSubscriptionPlanId = 1;
    private const int RefreshTokenDays = 7;
    private const int ResendCooldownSeconds = 60;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly JwtSettings _jwtSettings;
    private readonly OtpSettings _otpSettings;
    private readonly Microsoft.Extensions.Logging.ILogger<AuthService> _logger;

    public AuthService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IEmailService emailService,
        IOptions<JwtSettings> jwtOptions,
        IOptions<OtpSettings> otpOptions,
        Microsoft.Extensions.Logging.ILogger<AuthService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _emailService = emailService;
        _jwtSettings = jwtOptions.Value;
        _otpSettings = otpOptions.Value;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);

        if (await _unitOfWork.Users.ExistsByEmailAsync(normalizedEmail))
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var user = _mapper.Map<User>(request);
        user.FullName = request.FullName.Trim();
        user.Email = normalizedEmail;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        user.RoleId = DefaultRoleId;
        user.SubscriptionPlanId = DefaultSubscriptionPlanId;
        user.EmailConfirmed = false;
        user.OtpFailedCount = 0;

        var otp = SetEmailOtp(user);

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();
        user = await GetUserByEmailOrThrowAsync(user.Email);
        
        Console.WriteLine($"[OTP] Generated OTP for {user.Email}: {otp}");

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendOtpEmailAsync(user.Email, user.FullName, otp);
                Console.WriteLine($"[OTP] Email sent to {user.Email}");
            }
            catch (Exception exception)
            {
                Console.WriteLine($"[OTP] Failed to send email to {user.Email}: {exception.Message}");
            }
        });

        return BuildUnverifiedAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email ?? string.Empty;
        string maskedEmail = email;
        int atIndex = email.IndexOf('@');
        if (atIndex > 1)
        {
            maskedEmail = email[0] + "***" + email[atIndex..];
        }
        _logger.LogInformation("LOGIN_START for email: {Email}", maskedEmail);
        var totalTimer = System.Diagnostics.Stopwatch.StartNew();

        var dbTimer = System.Diagnostics.Stopwatch.StartNew();
        var normalizedEmail = NormalizeEmail(email);
        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        dbTimer.Stop();
        _logger.LogInformation("LOGIN_DB_QUERY took {Ms}ms", dbTimer.ElapsedMilliseconds);

        var verifyTimer = System.Diagnostics.Stopwatch.StartNew();
        var isPasswordValid = user is not null && BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        verifyTimer.Stop();
        _logger.LogInformation("LOGIN_PASSWORD_VERIFY took {Ms}ms", verifyTimer.ElapsedMilliseconds);

        if (!isPasswordValid)
        {
            totalTimer.Stop();
            _logger.LogWarning("LOGIN_FAILED: Invalid email or password. Total time: {Ms}ms", totalTimer.ElapsedMilliseconds);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var authenticatedUser = user ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!authenticatedUser.EmailConfirmed)
        {
            totalTimer.Stop();
            _logger.LogWarning("LOGIN_FAILED: Email is not verified. Total time: {Ms}ms", totalTimer.ElapsedMilliseconds);
            throw new UnauthorizedAccessException("Email is not verified.");
        }

        var saveTimer = System.Diagnostics.Stopwatch.StartNew();
        var (refreshToken, refreshTokenExpiresAt) = await CreateRefreshTokenAsync(authenticatedUser.UserId);
        await _unitOfWork.SaveChangesAsync();
        saveTimer.Stop();
        _logger.LogInformation("LOGIN_DB_SAVE_REFRESH_TOKEN took {Ms}ms", saveTimer.ElapsedMilliseconds);

        var mapJwtTimer = System.Diagnostics.Stopwatch.StartNew();
        var response = BuildAuthResponse(authenticatedUser, refreshToken, refreshTokenExpiresAt);
        mapJwtTimer.Stop();
        _logger.LogInformation("LOGIN_JWT_GENERATE_AND_MAP took {Ms}ms", mapJwtTimer.ElapsedMilliseconds);

        totalTimer.Stop();
        _logger.LogInformation("LOGIN_TOTAL took {Ms}ms", totalTimer.ElapsedMilliseconds);

        return response;
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var refreshToken = request.RefreshToken.Trim();
        var tokenHash = HashRefreshToken(refreshToken);
        var storedToken = await _unitOfWork.RefreshTokens.GetActiveByHashAsync(tokenHash);

        if (storedToken is null || !storedToken.User.EmailConfirmed)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        var (newRefreshToken, newRefreshTokenExpiresAt) = await CreateRefreshTokenAsync(storedToken.UserId);
        _unitOfWork.RefreshTokens.Revoke(storedToken, HashRefreshToken(newRefreshToken));
        await _unitOfWork.SaveChangesAsync();

        return BuildAuthResponse(storedToken.User, newRefreshToken, newRefreshTokenExpiresAt);
    }

    public async Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var user = await GetUserByEmailOrThrowAsync(request.Email);

        if (user.EmailConfirmed)
        {
            var (refreshToken, refreshTokenExpiresAt) = await CreateRefreshTokenAsync(user.UserId);
            await _unitOfWork.SaveChangesAsync();
            return BuildAuthResponse(user, refreshToken, refreshTokenExpiresAt);
        }

        if (string.IsNullOrWhiteSpace(user.EmailOtpHash) ||
            user.EmailOtpExpiryTime is null ||
            user.EmailOtpExpiryTime <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("OTP is invalid or expired.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Otp.Trim(), user.EmailOtpHash))
        {
            user.OtpFailedCount++;
            await _unitOfWork.SaveChangesAsync();
            throw new UnauthorizedAccessException("OTP is invalid or expired.");
        }

        user.EmailConfirmed = true;
        user.EmailOtpHash = null;
        user.EmailOtpExpiryTime = null;
        user.OtpFailedCount = 0;
        var (newRefreshToken, newRefreshTokenExpiresAt) = await CreateRefreshTokenAsync(user.UserId);

        await _unitOfWork.SaveChangesAsync();

        return BuildAuthResponse(user, newRefreshToken, newRefreshTokenExpiresAt);
    }

    public async Task ResendOtpAsync(ResendOtpRequest request)
    {
        var user = await GetUserByEmailOrThrowAsync(request.Email);

        if (user.EmailConfirmed)
        {
            throw new InvalidOperationException("Email is already verified.");
        }

        if (user.OtpLastSentAt is not null &&
            user.OtpLastSentAt.Value.AddSeconds(ResendCooldownSeconds) > DateTime.UtcNow)
        {
            throw new InvalidOperationException("Please wait before requesting a new OTP.");
        }

        var otp = SetEmailOtp(user);
        await _unitOfWork.SaveChangesAsync();
        
        Console.WriteLine($"[OTP] Generated OTP for {user.Email}: {otp}");

        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendOtpEmailAsync(user.Email, user.FullName, otp);
            }
            catch (Exception exception)
            {
                Console.WriteLine($"[OTP] Failed to send email to {user.Email}: {exception.Message}");
            }
        });
    }

    public async Task LogoutAsync(LogoutRequest request)
    {
        var refreshToken = request.RefreshToken.Trim();

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var tokenHash = HashRefreshToken(refreshToken);
        var storedToken = await _unitOfWork.RefreshTokens.GetActiveByHashAsync(tokenHash);

        if (storedToken is null)
        {
            return;
        }

        _unitOfWork.RefreshTokens.Revoke(storedToken);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Mật khẩu hiện tại không chính xác.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();
     }

     public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
     {
         var user = await GetUserByEmailOrThrowAsync(request.Email);

         if (user.OtpLastSentAt is not null &&
             user.OtpLastSentAt.Value.AddSeconds(ResendCooldownSeconds) > DateTime.UtcNow)
         {
             throw new InvalidOperationException("Vui lòng đợi trước khi yêu cầu mã OTP mới.");
         }

         var otp = SetEmailOtp(user);

         _unitOfWork.Users.Update(user);
         await _unitOfWork.SaveChangesAsync();

         Console.WriteLine($"[Forgot Password OTP] Generated OTP for {user.Email}: {otp}");

         _ = Task.Run(async () =>
         {
             try
             {
                 await _emailService.SendResetPasswordOtpEmailAsync(user.Email, user.FullName, otp);
             }
             catch (Exception exception)
             {
                 Console.WriteLine($"[Forgot Password OTP] Failed to send email to {user.Email}: {exception.Message}");
             }
         });
     }

     public async Task VerifyResetOtpAsync(VerifyOtpRequest request)
     {
         var user = await GetUserByEmailOrThrowAsync(request.Email);

         if (string.IsNullOrWhiteSpace(user.EmailOtpHash) ||
             user.EmailOtpExpiryTime is null ||
             user.EmailOtpExpiryTime <= DateTime.UtcNow)
         {
             throw new UnauthorizedAccessException("Mã OTP không hợp lệ hoặc đã hết hạn.");
         }

         if (!BCrypt.Net.BCrypt.Verify(request.Otp.Trim(), user.EmailOtpHash))
         {
             user.OtpFailedCount++;
             _unitOfWork.Users.Update(user);
             await _unitOfWork.SaveChangesAsync();

             throw new UnauthorizedAccessException("Mã OTP không hợp lệ.");
         }
     }

     public async Task ResetPasswordAsync(ResetPasswordRequest request)
     {
         var user = await GetUserByEmailOrThrowAsync(request.Email);

         if (string.IsNullOrWhiteSpace(user.EmailOtpHash) ||
             user.EmailOtpExpiryTime is null ||
             user.EmailOtpExpiryTime <= DateTime.UtcNow)
         {
             throw new UnauthorizedAccessException("Mã OTP không hợp lệ hoặc đã hết hạn.");
         }

         if (!BCrypt.Net.BCrypt.Verify(request.Otp.Trim(), user.EmailOtpHash))
         {
             user.OtpFailedCount++;

             _unitOfWork.Users.Update(user);
             await _unitOfWork.SaveChangesAsync();

             throw new UnauthorizedAccessException("Mã OTP không hợp lệ hoặc đã hết hạn.");
         }

         user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
         user.EmailOtpHash = null;
         user.EmailOtpExpiryTime = null;
         user.OtpFailedCount = 0;
         user.UpdatedAt = DateTime.UtcNow;

         _unitOfWork.Users.Update(user);
         await _unitOfWork.SaveChangesAsync();
     }

     private async Task<User> GetUserByEmailOrThrowAsync(string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);

        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        return user;
    }

    private AuthResponse BuildAuthResponse(User user, string refreshToken, DateTime refreshTokenExpiresAt)
    {
        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(GetAccessTokenDurationInMinutes());
        var response = _mapper.Map<AuthResponse>(user);

        response.AccessToken = GenerateAccessToken(user, accessTokenExpiresAt);
        response.RefreshToken = refreshToken;
        response.AccessTokenExpiresAt = accessTokenExpiresAt;
        response.RefreshTokenExpiresAt = refreshTokenExpiresAt;

        return response;
    }

    private AuthResponse BuildUnverifiedAuthResponse(User user)
    {
        var response = _mapper.Map<AuthResponse>(user);
        response.AccessToken = string.Empty;
        response.RefreshToken = string.Empty;
        response.AccessTokenExpiresAt = DateTime.MinValue;
        response.RefreshTokenExpiresAt = DateTime.MinValue;

        return response;
    }

    private string GenerateAccessToken(User user, DateTime expiresAt)
    {
        if (string.IsNullOrWhiteSpace(_jwtSettings.Key) || _jwtSettings.Key.Length < 32)
        {
            throw new InvalidOperationException("JWT key must be at least 32 characters.");
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.Name)
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<(string Token, DateTime ExpiresAt)> CreateRefreshTokenAsync(int userId)
    {
        var token = GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays);
        await _unitOfWork.RefreshTokens.AddAsync(new RefreshToken
        {
            UserId = userId,
            TokenHash = HashRefreshToken(token),
            ExpiresAt = expiresAt
        });

        return (token, expiresAt);
    }

    private string SetEmailOtp(User user)
    {
        var otp = GenerateOtp();
        user.EmailOtpHash = BCrypt.Net.BCrypt.HashPassword(otp);
        user.EmailOtpExpiryTime = DateTime.UtcNow.AddMinutes(GetOtpExpireMinutes());
        user.OtpLastSentAt = DateTime.UtcNow;
        user.OtpFailedCount = 0;

        return otp;
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }

    private static string HashRefreshToken(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(bytes);
    }

    private static string GenerateOtp()
    {
        return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
    }

    private int GetAccessTokenDurationInMinutes()
    {
        return _jwtSettings.DurationInMinutes > 0
            ? _jwtSettings.DurationInMinutes
            : 60;
    }

    private int GetOtpExpireMinutes()
    {
        return _otpSettings.ExpireMinutes > 0
            ? _otpSettings.ExpireMinutes
            : 5;
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
