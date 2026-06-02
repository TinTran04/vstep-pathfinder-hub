using BusinessLogicLayer.Core.Settings;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace BusinessLogicLayer.Integrations.Email;

public class EmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly BrevoSettings _brevoSettings;

    public EmailService(HttpClient httpClient, IOptions<BrevoSettings> brevoOptions)
    {
        _httpClient = httpClient;
        _brevoSettings = brevoOptions.Value;
    }

    public async Task SendOtpEmailAsync(string toEmail, string toName, string otp)
    {
        ValidateSettings();

        await SendTransactionalEmailAsync(
            toEmail,
            toName,
            "Mã OTP xác thực email VAI",
            $"Mã OTP xác thực email VAI của bạn là {otp}. Mã này sẽ hết hạn trong vài phút. Vui lòng không chia sẻ mã này với bất kỳ ai.");
    }

    public async Task SendResetPasswordOtpEmailAsync(string toEmail, string toName, string otp)
    {
        ValidateSettings();

        await SendTransactionalEmailAsync(
            toEmail,
            toName,
            "Đặt lại mật khẩu tài khoản VSTEPPro",
            $"Mã OTP để đặt lại mật khẩu tài khoản của bạn là {otp}. Mã này sẽ hết hạn trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.");
    }

    private async Task SendTransactionalEmailAsync(string toEmail, string toName, string subject, string textContent)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "v3/smtp/email");
        request.Headers.Add("api-key", _brevoSettings.ApiKey);
        request.Headers.Accept.ParseAdd("application/json");
        request.Content = JsonContent.Create(new BrevoEmailRequest(
            new BrevoEmailAddress(_brevoSettings.FromEmail, _brevoSettings.FromName),
            [new BrevoEmailAddress(toEmail, toName)],
            subject,
            textContent));

        using var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Gửi email qua Brevo thất bại với mã trạng thái {(int)response.StatusCode}: {error}");
        }
    }

    private void ValidateSettings()
    {
        if (string.IsNullOrWhiteSpace(_brevoSettings.ApiKey) ||
            string.IsNullOrWhiteSpace(_brevoSettings.FromEmail))
        {
            throw new InvalidOperationException("Cấu hình Brevo chưa được thiết lập.");
        }
    }

    private sealed record BrevoEmailRequest(
        [property: JsonPropertyName("sender")]
        BrevoEmailAddress Sender,
        [property: JsonPropertyName("to")]
        IReadOnlyCollection<BrevoEmailAddress> To,
        [property: JsonPropertyName("subject")]
        string Subject,
        [property: JsonPropertyName("textContent")]
        string TextContent);

    private sealed record BrevoEmailAddress(
        [property: JsonPropertyName("email")]
        string Email,
        [property: JsonPropertyName("name")]
        string Name);
}
