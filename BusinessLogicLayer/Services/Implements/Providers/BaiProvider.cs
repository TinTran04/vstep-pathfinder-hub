using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.DTOs.AI;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements.Providers;

public class BaiProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly BaiSettings _settings;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public string ProviderName => "BAI";

    public BaiProvider(HttpClient httpClient, IOptions<BaiSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public async Task<AiProviderResponse> SendChatRequestAsync(AiChatRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey) || string.IsNullOrWhiteSpace(_settings.BaseUrl))
        {
            throw new InvalidOperationException("BAI is not fully configured or disabled.");
        }

        request.Model = _settings.Model;

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, new Uri(new Uri(_settings.BaseUrl), "v1/chat/completions"))
        {
            Content = JsonContent.Create(request, options: JsonOptions)
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey.Trim());

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        var result = new AiProviderResponse
        {
            StatusCode = (int)response.StatusCode,
            RawResponse = rawResponse,
            IsSuccess = response.IsSuccessStatusCode
        };

        if (response.IsSuccessStatusCode)
        {
            try
            {
                using var document = JsonDocument.Parse(rawResponse);
                var root = document.RootElement;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var message = choices[0].GetProperty("message");
                    if (message.TryGetProperty("content", out var contentElement))
                    {
                        result.Content = contentElement.GetString() ?? string.Empty;
                    }
                }

                if (root.TryGetProperty("usage", out var usage))
                {
                    if (usage.TryGetProperty("prompt_tokens", out var inputTokens))
                        result.InputTokens = inputTokens.GetInt32();
                    
                    if (usage.TryGetProperty("completion_tokens", out var outputTokens))
                        result.OutputTokens = outputTokens.GetInt32();
                }
            }
            catch (JsonException)
            {
                result.IsSuccess = false;
            }
        }

        return result;
    }
}
