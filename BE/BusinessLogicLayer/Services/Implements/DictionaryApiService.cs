using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;

namespace BusinessLogicLayer.Services.Implements;

public class DictionaryApiService : IDictionaryApiService
{
    private readonly HttpClient _httpClient;

    public DictionaryApiService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<DictionaryEntry> GetEntryAsync(string word)
    {
        var normalizedWord = word.Trim().ToLowerInvariant();
        using var response = await _httpClient.GetAsync($"api/v2/entries/en/{Uri.EscapeDataString(normalizedWord)}");

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            throw new KeyNotFoundException("Word not found in dictionary API.");
        }

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        var entries = await JsonSerializer.DeserializeAsync<List<DictionaryApiEntry>>(stream, JsonOptions);
        var entry = entries?.FirstOrDefault() ?? throw new InvalidOperationException("Dictionary API returned an empty response.");
        var meaning = entry.Meanings.FirstOrDefault(meaning => meaning.Definitions.Count > 0)
            ?? throw new InvalidOperationException("Dictionary API response does not contain definitions.");
        var definition = meaning.Definitions.First();
        var audioUrl = NormalizeAudioUrl(entry.Phonetics.FirstOrDefault(phonetic => !string.IsNullOrWhiteSpace(phonetic.Audio))?.Audio);
        var phonetic = entry.Phonetics.FirstOrDefault(phonetic => !string.IsNullOrWhiteSpace(phonetic.Text))?.Text
            ?? entry.Phonetic;

        return new DictionaryEntry
        {
            Word = normalizedWord,
            Phonetic = NormalizeNullable(phonetic),
            AudioUrl = NormalizeNullable(audioUrl),
            PartOfSpeech = NormalizeNullable(meaning.PartOfSpeech),
            EnglishDefinition = definition.Definition.Trim(),
            Example = NormalizeNullable(definition.Example)
        };
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? NormalizeAudioUrl(string? value)
    {
        var audioUrl = NormalizeNullable(value);
        return audioUrl is not null && audioUrl.StartsWith("//", StringComparison.Ordinal)
            ? $"https:{audioUrl}"
            : audioUrl;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private sealed class DictionaryApiEntry
    {
        public string? Phonetic { get; set; }

        public List<DictionaryApiPhonetic> Phonetics { get; set; } = new();

        public List<DictionaryApiMeaning> Meanings { get; set; } = new();
    }

    private sealed class DictionaryApiPhonetic
    {
        public string? Text { get; set; }

        public string? Audio { get; set; }
    }

    private sealed class DictionaryApiMeaning
    {
        public string? PartOfSpeech { get; set; }

        public List<DictionaryApiDefinition> Definitions { get; set; } = new();
    }

    private sealed class DictionaryApiDefinition
    {
        [JsonPropertyName("definition")]
        public string Definition { get; set; } = string.Empty;

        public string? Example { get; set; }
    }
}
