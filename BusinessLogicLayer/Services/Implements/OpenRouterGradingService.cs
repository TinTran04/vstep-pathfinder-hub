using System.Net.Http.Headers;
using System.Net.Http.Json;
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
        return SendTextGradingRequestAsync(BuildWritingPrompt(prompt, essayText));
    }

    public async Task<AiScoreResult> GradeSpeakingAsync(string speakingPrompt, string audioUrl, string audioObjectKey)
    {
        var audioBytes = await DownloadAudioAsync(audioUrl);
        var base64Audio = Convert.ToBase64String(audioBytes);
        var format = InferAudioFormat(audioObjectKey, audioUrl);
        var prompt = BuildSpeakingPrompt(speakingPrompt);

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

        var scoreValue = parsed.Score ?? parsed.Overall
            ?? throw new InvalidOperationException("OpenRouter grading response does not contain a score.");
        var score = Math.Clamp(scoreValue, 0, 10);

        return new AiScoreResult
        {
            Score = decimal.Round(score, 2),
            Feedback = TrimForStorage(ParseFeedback(parsed.Feedback)),
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

    private static string BuildWritingPrompt(string prompt, string essayText)
    {
        return WritingPromptTemplate
            .Replace("{task_type}", InferWritingTaskType(prompt), StringComparison.Ordinal)
            .Replace("{writing_prompt}", TrimForPrompt(prompt, 3000), StringComparison.Ordinal)
            .Replace("{essay}", TrimForPrompt(essayText, 12000), StringComparison.Ordinal);
    }

    private static string BuildSpeakingPrompt(string speakingPrompt)
    {
        return SpeakingPromptTemplate
            .Replace("{speaking_prompt}", TrimForPrompt(speakingPrompt, 3000), StringComparison.Ordinal);
    }

    private static string InferWritingTaskType(string prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return "task2";
        }

        var normalized = prompt.ToLowerInvariant();
        return normalized.Contains("task 1") ||
            normalized.Contains("task1") ||
            normalized.Contains("letter") ||
            normalized.Contains("email")
            ? "task1"
            : "task2";
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

    private static string? ParseFeedback(JsonElement? feedback)
    {
        if (feedback is null)
        {
            return null;
        }

        var value = feedback.Value;
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Array => string.Join("\n", value.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString())
                .Where(item => !string.IsNullOrWhiteSpace(item))),
            JsonValueKind.Null => null,
            _ => value.GetRawText()
        };
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

    private const string WritingPromptTemplate = """
        You are a professional VSTEP writing examiner with 10+ years of experience assessing B1, B2, and C1 candidates.

        Task type: {task_type}
        Writing prompt: {writing_prompt}

        Student essay:
        ---
        {essay}
        ---

        Evaluate strictly based on the official VSTEP Writing rubric (4 criteria, scale 0-10).
        Note on task types:
        - task1: Letter/email around 120 words. Assess format, tone (formal/informal), and whether all required points are addressed.
        - task2: Essay around 250 words. Assess argumentation, clear position, and supporting ideas.

        CRITERION 1 - TASK FULFILLMENT [MOST IMPORTANT, about 50% weight]
        - 1-2: Completely off-topic or too short to assess. Fails to address the prompt.
        - 3-4: Attempts to address the task but misses key points or significantly goes off-topic. Wrong format or tone for task1.
        - 5-6: Generally addresses the task with most key points covered. Minor omissions or slightly inappropriate tone/format.
        - 7-8: Fully addresses the task. All key points covered clearly. Appropriate format and tone. Clear position with supporting ideas (task2).
        - 9-10: Excellent task fulfillment. All requirements met thoroughly. Compelling argument or perfectly crafted letter with nuanced tone.

        CRITERION 2 - GRAMMAR [about 25% weight]
        - 1-2: Only very basic structures, systematic errors make the writing very hard to understand.
        - 3-4: Mostly simple sentences. Frequent errors including basic ones (articles, prepositions, verb tense).
        - 5-6: Mix of simple and some complex sentences. Errors present but meaning is generally clear. Some attempt at complex structures.
        - 7-8: Good range of complex structures. Minor errors only, do not impede understanding.
        - 9-10: Wide range of grammatical structures used accurately and flexibly. Near error-free.

        CRITERION 3 - VOCABULARY [about 15% weight]
        - 1-2: Very limited vocabulary. Frequent wrong word choices. Meaning often unclear.
        - 3-4: Basic vocabulary only, highly repetitive. Inappropriate word choices for the topic.
        - 5-6: Adequate vocabulary for the topic. Some variety but over-reliance on common words. Some spelling/word form errors.
        - 7-8: Good range including less common words, collocations, and topic-specific terms. Generally accurate.
        - 9-10: Wide, precise vocabulary including idiomatic expressions and academic language.

        CRITERION 4 - ORGANIZATION [about 10% weight]
        - 1-2: No clear structure. Ideas are random and incoherent. No use of connectors.
        - 3-4: Weak structure. Ideas loosely organized. Very limited use of connectors.
        - 5-6: Basic structure present. Some use of connectors. Paragraphing attempted but not always logical.
        - 7-8: Clear, logical structure. Well-organized paragraphs with good cohesive devices.
        - 9-10: Excellent organization. Seamless flow between ideas and paragraphs.

        Scoring rules:
        - Score each criterion independently in increments of 0.5.
        - score = weighted average: (task_response * 2 + grammar * 1 + vocabulary * 0.6 + organization * 0.4) / 4.
        - feedback: 3-5 specific, actionable points in English, each referencing a specific criterion.

        IMPORTANT: Return ONLY valid JSON. No explanation, no markdown, no extra text.
        The backend parser requires "score" and "feedback". Criterion fields are optional but recommended.
        {
          "score": <number>,
          "task_response": <number>,
          "organization": <number>,
          "vocabulary": <number>,
          "grammar": <number>,
          "feedback": ["<string>", "<string>", "<string>"]
        }
        """;

    private const string SpeakingPromptTemplate = """
        You are a professional VSTEP speaking examiner with 10+ years of experience assessing B1, B2, and C1 candidates.

        Speaking task: {speaking_prompt}

        First transcribe the attached student audio. Then evaluate the transcript strictly based on the official VSTEP Speaking rubric (5 criteria, scale 0-10).
        The transcript is auto-generated by you from the audio, so minor transcription uncertainty may exist. Score based on meaning, pronunciation evidence, fluency, and linguistic quality.

        CRITERION 1 - FLUENCY & IDEA DEVELOPMENT
        - 1-2: Extremely hesitant, almost no idea development, very fragmented speech.
        - 3-4: Frequent pauses and repetitions, limited idea development, hard to follow.
        - 5-6: Some hesitation but generally able to continue. Basic idea development with simple elaboration.
        - 7-8: Speaks with reasonable fluency. Can develop and expand ideas with some detail and examples.
        - 9-10: Fully fluent, natural pace. Develops ideas clearly with strong examples and elaboration.

        CRITERION 2 - VOCABULARY
        - 1-2: Very limited vocabulary, frequent wrong word choices, meaning often unclear.
        - 3-4: Basic vocabulary only, repetitive, some inappropriate choices for the topic.
        - 5-6: Adequate vocabulary for the topic. Some variety but limited range of less common words.
        - 7-8: Good range of vocabulary including less common words. Generally appropriate and accurate.
        - 9-10: Wide, precise vocabulary including idiomatic expressions and topic-specific terms.

        CRITERION 3 - GRAMMAR
        - 1-2: Only very basic sentence structures, systematic errors make speech hard to understand.
        - 3-4: Simple sentences mostly, frequent grammar errors including basic ones.
        - 5-6: Mix of simple and compound sentences, some complex structures attempted. Errors present but meaning generally clear.
        - 7-8: Frequent use of compound and complex sentences, flexible structures, minor errors only.
        - 9-10: Wide range of grammatical structures used accurately and flexibly.

        CRITERION 4 - CONTENT & COHERENCE
        - 1-2: Response is largely off-topic or too short to assess. No logical organization.
        - 3-4: Attempts to address the task but frequently goes off-topic. Weak use of connectors.
        - 5-6: Generally on-topic. Basic logical organization with some connectors.
        - 7-8: Clearly addresses the task. Well-organized response with appropriate connectors.
        - 9-10: Fully addresses the task with well-supported, logically structured response.

        CRITERION 5 - PRONUNCIATION
        - 1-2: Very poor pronunciation, output is largely incoherent.
        - 3-4: Many basic pronunciation issues.
        - 5-6: Reasonably clear, with some pronunciation errors.
        - 7-8: Clear and accurate pronunciation.
        - 9-10: Near-native pronunciation.

        Scoring rules:
        - Score each criterion independently in increments of 0.5.
        - score = average of all 5 criteria.
        - feedback: 3-5 specific, actionable points in English referencing the rubric criteria above.
        - transcript: concise transcript of the student's answer, or empty string if the audio is not understandable.

        IMPORTANT: Return ONLY valid JSON. No explanation, no markdown, no extra text.
        The backend parser requires "score", "feedback", and "transcript". Criterion fields are optional but recommended.
        {
          "score": <number>,
          "fluency": <number>,
          "vocabulary": <number>,
          "grammar": <number>,
          "relevance": <number>,
          "pronunciation": <number>,
          "feedback": ["<string>", "<string>", "<string>"],
          "transcript": "<string>"
        }
        """;

    private sealed class OpenRouterChatRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("messages")]
        public List<OpenRouterMessage> Messages { get; set; } = new();

        [JsonPropertyName("temperature")]
        public double Temperature { get; set; } = 0.1;

        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; } = 800;

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
        public decimal? Score { get; set; }

        public decimal? Overall { get; set; }

        public JsonElement? Feedback { get; set; }

        public string? Transcript { get; set; }
    }
}
