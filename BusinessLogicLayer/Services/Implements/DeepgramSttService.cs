using System.Net.Http.Headers;
using System.Text.Json;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements;

public class DeepgramSttService : ISpeechToTextService
{
    private readonly HttpClient _httpClient;
    private readonly DeepgramSettings _settings;

    public DeepgramSttService(HttpClient httpClient, IOptions<DeepgramSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public async Task<SttResult> TranscribeAsync(Stream audioStream, string contentType, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new InvalidOperationException("Deepgram API key is not configured.");
        }

        if (audioStream.CanSeek)
        {
            audioStream.Position = 0;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, BuildListenUri())
        {
            Content = new StreamContent(audioStream)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Token", _settings.ApiKey.Trim());
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(NormalizeContentType(contentType));

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Deepgram STT failed with HTTP {(int)response.StatusCode}. {TrimForError(rawResponse)}",
                null,
                response.StatusCode);
        }

        using var document = JsonDocument.Parse(rawResponse);
        var alternative = document.RootElement
            .GetProperty("results")
            .GetProperty("channels")[0]
            .GetProperty("alternatives")[0];

        return new SttResult
        {
            Transcript = alternative.TryGetProperty("transcript", out var transcript)
                ? transcript.GetString() ?? string.Empty
                : string.Empty,
            Confidence = alternative.TryGetProperty("confidence", out var confidence) && confidence.TryGetDouble(out var value)
                ? value
                : null,
            RawResponse = rawResponse
        };
    }

    private Uri BuildListenUri()
    {
        var baseUrl = NormalizeBaseUrl(_settings.BaseUrl);
        var model = string.IsNullOrWhiteSpace(_settings.Model) ? "nova-3" : _settings.Model.Trim();
        var path = $"v1/listen?model={Uri.EscapeDataString(model)}&smart_format=true&language=en";
        return new Uri(new Uri(baseUrl), path);
    }

    private static string NormalizeBaseUrl(string? baseUrl)
    {
        var value = string.IsNullOrWhiteSpace(baseUrl)
            ? "https://api.deepgram.com"
            : baseUrl.Trim();
        return value.EndsWith('/') ? value : value + "/";
    }

    private static string NormalizeContentType(string? contentType)
    {
        return string.IsNullOrWhiteSpace(contentType) ? "audio/webm" : contentType.Trim();
    }

    private static string TrimForError(string value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Length <= 500 ? value : value[..500];
    }
}
