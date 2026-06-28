namespace BusinessLogicLayer.Core.Settings;

public class ElevenLabsSettings
{
    public string ApiKey { get; set; } = string.Empty;

    public string SttModel { get; set; } = "scribe_v2";

    public string BaseUrl { get; set; } = "https://api.elevenlabs.io/";
}
