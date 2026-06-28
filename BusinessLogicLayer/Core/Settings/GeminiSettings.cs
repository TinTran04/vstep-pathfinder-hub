namespace BusinessLogicLayer.Core.Settings;

public class GeminiSettings
{
    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "gemini-2.5-flash-lite";

    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/";

    public int MaxOutputTokens { get; set; } = 4000;
}
