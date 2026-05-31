using System.Net;
using System.Text.Json;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements;

public class TranslationService : ITranslationService
{
    private readonly HttpClient _httpClient;
    private readonly MyMemorySettings _settings;

    public TranslationService(HttpClient httpClient, IOptions<MyMemorySettings> options)
    {
        _httpClient = httpClient;
        _settings = options.Value;
    }

    public async Task<string> TranslateEnToViAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var query = $"get?q={Uri.EscapeDataString(text.Trim())}&langpair=en|vi";
        if (!string.IsNullOrWhiteSpace(_settings.Email))
        {
            query += $"&de={Uri.EscapeDataString(_settings.Email.Trim())}";
        }

        using var response = await _httpClient.GetAsync(query);
        if (response.StatusCode == HttpStatusCode.TooManyRequests)
        {
            throw new InvalidOperationException("Translation API daily limit reached.");
        }

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        var result = await JsonSerializer.DeserializeAsync<MyMemoryResponse>(stream, JsonOptions);
        var translatedText = result?.ResponseData?.TranslatedText;

        return string.IsNullOrWhiteSpace(translatedText)
            ? string.Empty
            : translatedText.Trim();
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private sealed class MyMemoryResponse
    {
        public MyMemoryResponseData? ResponseData { get; set; }
    }

    private sealed class MyMemoryResponseData
    {
        public string? TranslatedText { get; set; }
    }
}
