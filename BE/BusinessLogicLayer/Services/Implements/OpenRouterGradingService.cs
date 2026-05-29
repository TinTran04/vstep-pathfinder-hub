using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.DTOs.AI;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements;

public class OpenRouterGradingService : IOpenRouterGradingService
{
    private readonly HttpClient _httpClient;
    private readonly OpenRouterSettings _settings;

    public OpenRouterGradingService(HttpClient httpClient, IOptions<OpenRouterSettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public Task<AiScoreResult> GradeWritingAsync(string prompt, string essayText)
    {
        var content = $"""
            Grade this VSTEP Writing submission on a 0-10 scale.
            Return only compact JSON with fields: score, feedback.
            Feedback must be 1-2 short English sentences.

            Prompt:
            {TrimForPrompt(prompt, 3000)}

            Essay:
            {TrimForPrompt(essayText, 12000)}
            """;

        return SendTextGradingRequestAsync(content);
    }

    public async Task<AiScoreResult> GradeSpeakingAsync(string audioUrl, string audioObjectKey)
    {
        var audioBytes = await DownloadAudioAsync(audioUrl);
        var base64Audio = Convert.ToBase64String(audioBytes);
        var format = InferAudioFormat(audioObjectKey, audioUrl);
        var prompt = """
            Transcribe and grade this VSTEP Speaking audio on a 0-10 scale.
            Consider pronunciation, fluency, grammar, vocabulary, coherence, and task achievement.
            Return only compact JSON with fields: score, feedback, transcript.
            Feedback must be 1-2 short English sentences.
            Transcript should be concise and may be empty if the audio is not understandable.
            """;

        var request = new OpenRouterChatRequest
        {
            Model = GetModel(),
            Messages = new List<OpenRouterMessage>
            {
                new()
                {
                    Role = "user",
                    Content = new object[]
                    {
                        new { type = "text", text = prompt },
                        new
                        {
                            type = "input_audio",
                            input_audio = new
                            {
                                data = base64Audio,
                                format
                            }
                        }
                    }
                }
            }
        };

        return await SendChatRequestAsync(request);
    }

    private Task<AiScoreResult> SendTextGradingRequestAsync(string prompt)
    {
        var request = new OpenRouterChatRequest
        {
            Model = GetModel(),
            Messages = new List<OpenRouterMessage>
            {
                new()
                {
                    Role = "user",
                    Content = prompt
                }
            }
        };

        return SendChatRequestAsync(request);
    }

    private async Task<AiScoreResult> SendChatRequestAsync(OpenRouterChatRequest payload)
    {
        EnsureConfigured();

        using var request = new HttpRequestMessage(HttpMethod.Post, "api/v1/chat/completions")
        {
            Content = JsonContent.Create(payload, options: JsonOptions)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey.Trim());

        if (!string.IsNullOrWhiteSpace(_settings.SiteUrl))
        {
            request.Headers.TryAddWithoutValidation("HTTP-Referer", _settings.SiteUrl.Trim());
        }

        if (!string.IsNullOrWhiteSpace(_settings.AppName))
        {
            request.Headers.TryAddWithoutValidation("X-Title", _settings.AppName.Trim());
        }

        using var response = await _httpClient.SendAsync(request);
        var result = await response.Content.ReadFromJsonAsync<OpenRouterChatResponse>(JsonOptions);

        if (!response.IsSuccessStatusCode || result?.Choices.Count is null or 0)
        {
            throw new InvalidOperationException("OpenRouter grading request failed.");
        }

        var content = result.Choices[0].Message.Content;
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("OpenRouter returned an empty grading response.");
        }

        return ParseScoreResult(content);
    }

    private async Task<byte[]> DownloadAudioAsync(string audioUrl)
    {
        if (string.IsNullOrWhiteSpace(audioUrl) || !Uri.TryCreate(audioUrl, UriKind.Absolute, out var uri))
        {
            throw new InvalidOperationException("A valid speaking audio URL is required for grading.");
        }

        using var response = await _httpClient.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();

        var maxBytes = _settings.MaxAudioBytes > 0 ? _settings.MaxAudioBytes : 15728640;
        if (response.Content.Headers.ContentLength > maxBytes)
        {
            throw new InvalidOperationException("Speaking audio is too large for AI grading.");
        }

        await using var source = await response.Content.ReadAsStreamAsync();
        using var destination = new MemoryStream();
        var buffer = new byte[81920];
        int read;
        while ((read = await source.ReadAsync(buffer)) > 0)
        {
            if (destination.Length + read > maxBytes)
            {
                throw new InvalidOperationException("Speaking audio is too large for AI grading.");
            }

            await destination.WriteAsync(buffer.AsMemory(0, read));
        }

        return destination.ToArray();
    }

    private AiScoreResult ParseScoreResult(string content)
    {
        var json = ExtractJsonObject(content);
        var parsed = JsonSerializer.Deserialize<OpenRouterScoreResponse>(json, JsonOptions)
            ?? throw new InvalidOperationException("OpenRouter grading response is not valid JSON.");

        var score = Math.Clamp(parsed.Score, 0, 10);
        return new AiScoreResult
        {
            Score = decimal.Round(score, 2),
            Feedback = TrimForStorage(parsed.Feedback),
            Transcript = TrimForStorage(parsed.Transcript)
        };
    }

    private static string ExtractJsonObject(string content)
    {
        var trimmed = content.Trim();
        if (trimmed.StartsWith('{') && trimmed.EndsWith('}'))
        {
            return trimmed;
        }

        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');
        if (start < 0 || end <= start)
        {
            throw new InvalidOperationException("OpenRouter grading response does not contain JSON.");
        }

        return trimmed[start..(end + 1)];
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new InvalidOperationException("OpenRouter API key is not configured.");
        }
    }

    private string GetModel()
    {
        return string.IsNullOrWhiteSpace(_settings.Model)
            ? "google/gemini-flash-1.5"
            : _settings.Model.Trim();
    }

    private static string InferAudioFormat(string audioObjectKey, string audioUrl)
    {
        var source = !string.IsNullOrWhiteSpace(audioObjectKey) ? audioObjectKey : audioUrl;
        var extension = Path.GetExtension(source.Split('?', 2)[0]).TrimStart('.').ToLowerInvariant();

        return extension switch
        {
            "mp3" => "mp3",
            "wav" => "wav",
            "m4a" => "m4a",
            "aac" => "aac",
            "ogg" => "ogg",
            "flac" => "flac",
            "aiff" => "aiff",
            _ => "webm"
        };
    }

    private static string TrimForPrompt(string value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static string? TrimForStorage(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= 1800 ? trimmed : trimmed[..1800];
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private sealed class OpenRouterChatRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("messages")]
        public List<OpenRouterMessage> Messages { get; set; } = new();

        [JsonPropertyName("temperature")]
        public double Temperature { get; set; } = 0.1;

        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; } = 600;

        [JsonPropertyName("response_format")]
        public object ResponseFormat { get; set; } = new { type = "json_object" };
    }

    private sealed class OpenRouterMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public object Content { get; set; } = string.Empty;
    }

    private sealed class OpenRouterChatResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenRouterChoice> Choices { get; set; } = new();
    }

    private sealed class OpenRouterChoice
    {
        [JsonPropertyName("message")]
        public OpenRouterResponseMessage Message { get; set; } = new();
    }

    private sealed class OpenRouterResponseMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }

    private sealed class OpenRouterScoreResponse
    {
        public decimal Score { get; set; }

        public string? Feedback { get; set; }

        public string? Transcript { get; set; }
    }
}
