namespace BusinessLogicLayer.Core.Settings;

public class OpenRouterSettings
{
    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "google/gemini-flash-1.5";

    public string BaseUrl { get; set; } = "https://openrouter.ai/";

    public string SiteUrl { get; set; } = string.Empty;

    public string AppName { get; set; } = "VAIApplication";

    public int MaxAudioBytes { get; set; } = 15728640;
}
