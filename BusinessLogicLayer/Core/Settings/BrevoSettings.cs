namespace BusinessLogicLayer.Core.Settings;

public class BrevoSettings
{
    public string ApiKey { get; set; } = string.Empty;

    public string FromEmail { get; set; } = string.Empty;

    public string FromName { get; set; } = "VAI Application";

    public string BaseUrl { get; set; } = "https://api.brevo.com/";
}
