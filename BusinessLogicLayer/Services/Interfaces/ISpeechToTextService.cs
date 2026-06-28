namespace BusinessLogicLayer.Services.Interfaces;

public interface ISpeechToTextService
{
    Task<SttResult> TranscribeAsync(Stream audioStream, string contentType, CancellationToken cancellationToken = default);
}

public class SttResult
{
    public string Transcript { get; set; } = string.Empty;

    public string? Language { get; set; }

    public double? DurationSeconds { get; set; }

    public double? Confidence { get; set; }

    public string? RawResponse { get; set; }
}
