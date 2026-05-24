using BusinessLogicLayer.Core.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace BusinessLogicLayer.Integrations.Email;

public class EmailService : IEmailService
{
    private readonly SmtpSettings _smtpSettings;

    public EmailService(IOptions<SmtpSettings> smtpOptions)
    {
        _smtpSettings = smtpOptions.Value;
    }

    public async Task SendOtpEmailAsync(string toEmail, string toName, string otp)
    {
        ValidateSettings();

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_smtpSettings.FromName, _smtpSettings.FromEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "VAI email verification OTP";
        message.Body = new TextPart("plain")
        {
            Text = $"Your VAI verification OTP is {otp}. This code expires in a few minutes. Do not share it with anyone."
        };

        using var smtpClient = new SmtpClient();
        await smtpClient.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, SecureSocketOptions.StartTls);
        await smtpClient.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);
        await smtpClient.SendAsync(message);
        await smtpClient.DisconnectAsync(true);
    }

    public async Task SendResetPasswordOtpEmailAsync(string toEmail, string toName, string otp)
    {
        ValidateSettings();

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_smtpSettings.FromName, _smtpSettings.FromEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "Đặt lại mật khẩu tài khoản VSTEPPro";
        message.Body = new TextPart("plain")
        {
            Text = $"Mã OTP để đặt lại mật khẩu tài khoản của bạn là {otp}. Mã này sẽ hết hạn trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai."
        };

        using var smtpClient = new SmtpClient();
        await smtpClient.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, SecureSocketOptions.StartTls);
        await smtpClient.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);
        await smtpClient.SendAsync(message);
        await smtpClient.DisconnectAsync(true);
    }

    private void ValidateSettings()
    {
        if (string.IsNullOrWhiteSpace(_smtpSettings.Host) ||
            string.IsNullOrWhiteSpace(_smtpSettings.Username) ||
            string.IsNullOrWhiteSpace(_smtpSettings.Password) ||
            string.IsNullOrWhiteSpace(_smtpSettings.FromEmail))
        {
            throw new InvalidOperationException("SMTP settings are not configured.");
        }
    }
}
