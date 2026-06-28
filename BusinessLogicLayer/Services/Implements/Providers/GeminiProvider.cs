using System.Net.Http.Json;
using System.Text.Json;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.DTOs.AI;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements.Providers;

public class GeminiProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public string ProviderName => "GEMINI";

    public GeminiProvider(HttpClient httpClient, IOptions<GeminiSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public async Task<AiProviderResponse> SendChatRequestAsync(AiChatRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new InvalidOperationException("Gemini API key is not configured.");
        }

        var model = string.IsNullOrWhiteSpace(request.Model) ? _settings.Model : request.Model;
        var baseUri = new Uri(NormalizeBaseUrl(_settings.BaseUrl));
        var path = $"v1beta/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(_settings.ApiKey.Trim())}";

        var payload = new
        {
            contents = request.Messages.Select(message => new
            {
                role = NormalizeRole(message.Role),
                parts = new[] { new { text = ExtractText(message.Content) } }
            }),
            generationConfig = new
            {
                temperature = request.Temperature ?? 0.1,
                maxOutputTokens = request.MaxTokens is > 0 ? request.MaxTokens.Value : GetMaxOutputTokens(),
                responseMimeType = "application/json"
            }
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, new Uri(baseUri, path))
        {
            Content = JsonContent.Create(payload, options: JsonOptions)
        };

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        var result = new AiProviderResponse
        {
            StatusCode = (int)response.StatusCode,
            RawResponse = rawResponse,
            IsSuccess = response.IsSuccessStatusCode
        };

        if (!response.IsSuccessStatusCode)
        {
            return result;
        }

        try
        {
            using var document = JsonDocument.Parse(rawResponse);
            var root = document.RootElement;

            if (root.TryGetProperty("candidates", out var candidates) &&
                candidates.ValueKind == JsonValueKind.Array &&
                candidates.GetArrayLength() > 0)
            {
                var content = candidates[0].GetProperty("content");
                if (content.TryGetProperty("parts", out var parts) &&
                    parts.ValueKind == JsonValueKind.Array &&
                    parts.GetArrayLength() > 0 &&
                    parts[0].TryGetProperty("text", out var textElement))
                {
                    result.Content = textElement.GetString() ?? string.Empty;
                }
            }

            if (root.TryGetProperty("usageMetadata", out var usage))
            {
                if (usage.TryGetProperty("promptTokenCount", out var inputTokens))
                    result.InputTokens = inputTokens.GetInt32();

                if (usage.TryGetProperty("candidatesTokenCount", out var outputTokens))
                    result.OutputTokens = outputTokens.GetInt32();
            }

            result.IsSuccess = !string.IsNullOrWhiteSpace(result.Content);
        }
        catch (JsonException)
        {
            result.IsSuccess = false;
        }

        return result;
    }

    private int GetMaxOutputTokens()
    {
        return _settings.MaxOutputTokens > 0 ? _settings.MaxOutputTokens : 4000;
    }

    private static string NormalizeBaseUrl(string? baseUrl)
    {
        var value = string.IsNullOrWhiteSpace(baseUrl)
            ? "https://generativelanguage.googleapis.com/"
            : baseUrl.Trim();
        return value.EndsWith('/') ? value : value + "/";
    }

    private static string NormalizeRole(string role)
    {
        return role.Equals("model", StringComparison.OrdinalIgnoreCase) ||
            role.Equals("assistant", StringComparison.OrdinalIgnoreCase)
            ? "model"
            : "user";
    }

    private static string ExtractText(object content)
    {
        if (content is string value)
        {
            return value;
        }

        return content?.ToString() ?? string.Empty;
    }
}
