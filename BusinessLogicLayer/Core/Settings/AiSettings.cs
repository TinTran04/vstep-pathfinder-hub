namespace BusinessLogicLayer.Core.Settings;

public class AiSettings
{
    public string PrimaryProvider { get; set; } = "OPENROUTER";
    public string FallbackProvider { get; set; } = "BAI";
}

public class BaiSettings
{
    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.b.ai";

    public string Model { get; set; } = "MiniMax-M3";
}
