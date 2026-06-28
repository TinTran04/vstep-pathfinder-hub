namespace BusinessLogicLayer.Core.Settings;

public class DeepgramSettings
{
    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "nova-3";

    public string BaseUrl { get; set; } = "https://api.deepgram.com";
}
