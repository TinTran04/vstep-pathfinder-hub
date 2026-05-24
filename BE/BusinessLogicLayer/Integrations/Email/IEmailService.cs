namespace BusinessLogicLayer.Integrations.Email;

public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string toName, string otp);
    Task SendResetPasswordOtpEmailAsync(string toEmail, string toName, string otp);
}
