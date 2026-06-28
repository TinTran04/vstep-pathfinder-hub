using System.Net.Http.Headers;
using System.Text.Json;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements;

public class ElevenLabsSttService : ISpeechToTextService
{
    private readonly HttpClient _httpClient;
    private readonly ElevenLabsSettings _settings;

    public ElevenLabsSttService(HttpClient httpClient, IOptions<ElevenLabsSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public async Task<SttResult> TranscribeAsync(Stream audioStream, string contentType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new InvalidOperationException("ElevenLabs API key is not configured.");
        }

        if (audioStream.CanSeek)
        {
            audioStream.Position = 0;
        }

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(GetSttModel()), "model_id");

        var audioContent = new StreamContent(audioStream);
        audioContent.Headers.ContentType = new MediaTypeHeaderValue(NormalizeContentType(contentType));
        form.Add(audioContent, "file", "speaking.webm");

        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri(new Uri(NormalizeBaseUrl(_settings.BaseUrl)), "v1/speech-to-text"))
        {
            Content = form
        };
        request.Headers.TryAddWithoutValidation("xi-api-key", _settings.ApiKey.Trim());

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"ElevenLabs STT failed with HTTP {(int)response.StatusCode}. {TrimForError(rawResponse)}",
                null,
                response.StatusCode);
        }

        using var document = JsonDocument.Parse(rawResponse);
        var root = document.RootElement;

        return new SttResult
        {
            Transcript = root.TryGetProperty("text", out var text) ? text.GetString() ?? string.Empty : string.Empty,
            Language = root.TryGetProperty("language_code", out var language) ? language.GetString() : null,
            DurationSeconds = TryGetDouble(root, "duration"),
            RawResponse = rawResponse
        };
    }

    private string GetSttModel()
    {
        return string.IsNullOrWhiteSpace(_settings.SttModel) ? "scribe_v2" : _settings.SttModel.Trim();
    }

    private static string NormalizeBaseUrl(string? baseUrl)
    {
        var value = string.IsNullOrWhiteSpace(baseUrl)
            ? "https://api.elevenlabs.io/"
            : baseUrl.Trim();
        return value.EndsWith('/') ? value : value + "/";
    }

    private static string NormalizeContentType(string? contentType)
    {
        return string.IsNullOrWhiteSpace(contentType) ? "audio/webm" : contentType.Trim();
    }

    private static double? TryGetDouble(JsonElement root, string propertyName)
    {
        if (root.TryGetProperty(propertyName, out var property) && property.TryGetDouble(out var value))
        {
            return value;
        }

        return null;
    }

    private static string TrimForError(string value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Length <= 500 ? value : value[..500];
    }
}
