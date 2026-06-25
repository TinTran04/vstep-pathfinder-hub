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
        return SendTextGradingRequestAsync(BuildWritingPrompt(prompt, essayText), "writing");
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
                            type = "image_url",
                            image_url = new
                            {
                                url = $"data:audio/{format};base64,{base64Audio}"
                            }
                        }
                    }
                }
            }
        };

        return await SendChatRequestAsync(request, "speaking");
    }

    private Task<AiScoreResult> SendTextGradingRequestAsync(string prompt, string skillType = "writing")
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

        return SendChatRequestAsync(request, skillType);
    }

    private async Task<AiScoreResult> SendChatRequestAsync(OpenRouterChatRequest payload, string skillType = "speaking")
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
        var rawResponse = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            var providerMessage = ExtractProviderError(rawResponse);
            throw new InvalidOperationException(
                $"OpenRouter grading request failed with HTTP {(int)response.StatusCode} {response.ReasonPhrase}. {providerMessage}");
        }

        var result = JsonSerializer.Deserialize<OpenRouterChatResponse>(rawResponse, JsonOptions);

        if (result?.Choices.Count is null or 0)
        {
            throw new InvalidOperationException("OpenRouter grading request failed.");
        }

        var content = result.Choices[0].Message.Content;
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("OpenRouter returned an empty grading response.");
        }

        return ParseScoreResult(content, skillType);
    }

    private static string ExtractProviderError(string rawResponse)
    {
        if (string.IsNullOrWhiteSpace(rawResponse))
        {
            return "Provider response body is empty.";
        }

        try
        {
            using var document = JsonDocument.Parse(rawResponse);
            if (document.RootElement.TryGetProperty("error", out var error))
            {
                if (error.ValueKind == JsonValueKind.Object &&
                    error.TryGetProperty("message", out var message) &&
                    message.ValueKind == JsonValueKind.String)
                {
                    return message.GetString() ?? rawResponse;
                }

                if (error.ValueKind == JsonValueKind.String)
                {
                    return error.GetString() ?? rawResponse;
                }
            }
        }
        catch (JsonException)
        {
            // Fall back to the raw provider response below.
        }

        return rawResponse.Length > 500 ? rawResponse[..500] : rawResponse;
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

    private AiScoreResult ParseScoreResult(string content, string skillType)
    {
        var json = ExtractJsonObject(content);
        var parsed = JsonSerializer.Deserialize<OpenRouterScoreResponse>(json, JsonOptions)
            ?? throw new InvalidOperationException("OpenRouter grading response is not valid JSON.");

        // ── Resolve criteria (new field ?? legacy aliases), clamp 0–10 ──
        var tf = ClampNullable(parsed.TaskFulfillment ?? parsed.TaskResponse ?? parsed.TaskAchievement);
        var gr = ClampNullable(parsed.Grammar);
        var vo = ClampNullable(parsed.Vocabulary);
        var org = ClampNullable(parsed.Organization);

        var fid = ClampNullable(parsed.FluencyIdeaDevelopment ?? parsed.Fluency);
        var pr = ClampNullable(parsed.Pronunciation);
        var cc = ClampNullable(parsed.ContentCoherence ?? parsed.TopicDevelopment ?? parsed.Relevance);

        // ── Backend calculates score from rubric ──
        decimal score;
        var aiFallbackScore = parsed.Score ?? parsed.OverallScore ?? parsed.Overall;

        if (skillType == "writing" && tf.HasValue && gr.HasValue && vo.HasValue && org.HasValue)
        {
            score = Math.Clamp((tf.Value * 2m + gr.Value * 1m + vo.Value * 0.6m + org.Value * 0.4m) / 4m, 0, 10);
        }
        else if (skillType == "speaking" && fid.HasValue && pr.HasValue && vo.HasValue && gr.HasValue && cc.HasValue)
        {
            score = Math.Clamp((fid.Value + pr.Value + vo.Value + gr.Value + cc.Value) / 5m, 0, 10);
        }
        else if (aiFallbackScore.HasValue)
        {
            score = Math.Clamp(aiFallbackScore.Value, 0, 10);
        }
        else
        {
            throw new InvalidOperationException("Grading response does not contain enough data to calculate a score.");
        }

        var feedbackPoints = new List<string>();
        if (parsed.Feedback.HasValue)
        {
            var f = parsed.Feedback.Value;
            if (f.ValueKind == JsonValueKind.Array)
            {
                feedbackPoints = f.EnumerateArray()
                    .Where(item => item.ValueKind == JsonValueKind.String)
                    .Select(item => item.GetString() ?? string.Empty)
                    .Where(item => !string.IsNullOrWhiteSpace(item))
                    .ToList();
            }
            else if (f.ValueKind == JsonValueKind.String)
            {
                var str = f.GetString();
                if (!string.IsNullOrWhiteSpace(str))
                {
                    feedbackPoints.Add(str);
                }
            }
        }

        return new AiScoreResult
        {
            Score = decimal.Round(score, 2),
            Feedback = TrimForStorage(ParseFeedback(parsed.Feedback)),
            Transcript = TrimForStorage(parsed.Transcript),
            FeedbackJson = json,

            // Writing: new + legacy
            TaskFulfillment = tf,
            Grammar = gr,
            Vocabulary = vo,
            Organization = org,
            TaskResponse = tf,
            TaskAchievement = tf,

            // Speaking: new + legacy
            FluencyIdeaDevelopment = fid,
            Pronunciation = pr,
            ContentCoherence = cc,
            Fluency = fid,
            TopicDevelopment = cc,
            Relevance = cc,

            FeedbackPoints = feedbackPoints
        };
    }

    private static decimal? ClampNullable(decimal? value)
    {
        return value.HasValue ? Math.Clamp(value.Value, 0, 10) : null;
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

        Evaluate strictly based on the official VSTEP Writing rubric. Score each of the 4 criteria independently on a scale of 0-10 in increments of 0.5.
        Do not calculate the final overall score. The backend will calculate it from the criteria.

        Note on task types:
        - task1: Letter/email around 120 words. Assess format, tone (formal/informal), and whether all required points are addressed.
        - task2: Essay around 250 words. Assess argumentation, clear position, and supporting ideas.

        CRITERION 1 — taskFulfillment (50% weight)
        Evaluate whether the student:
        - Answers the prompt correctly and completely
        - Addresses all required bullet points / sub-tasks
        - Uses the correct format (letter/email vs essay)
        - States a clear opinion/position (task2)
        - Provides relevant arguments and examples
        Band descriptors:
        - 1-2: Completely off-topic or too short. Fails to address the prompt.
        - 3-4: Attempts the task but misses key points. Wrong format or tone for task1.
        - 5-6: Generally addresses the task with most points covered. Minor omissions.
        - 7-8: Fully addresses the task. All points covered clearly. Clear position with supporting ideas.
        - 9-10: Excellent. All requirements met thoroughly. Compelling argument or perfectly crafted letter.

        CRITERION 2 — grammar (25% weight)
        Evaluate:
        - Grammatical accuracy (tense, articles, prepositions, verb conjugation)
        - Range of structures (simple, compound, complex sentences)
        - Whether errors impede meaning
        Band descriptors:
        - 1-2: Only basic structures, systematic errors make writing very hard to understand.
        - 3-4: Mostly simple sentences. Frequent basic errors.
        - 5-6: Mix of simple and complex sentences. Errors present but meaning generally clear.
        - 7-8: Good range of complex structures. Minor errors only.
        - 9-10: Wide range used accurately and flexibly. Near error-free.

        CRITERION 3 — vocabulary (15% weight)
        Evaluate:
        - Range and diversity of vocabulary
        - Topic-specific terms and collocations
        - Contextual appropriateness
        - Avoidance of repetition
        Band descriptors:
        - 1-2: Very limited vocabulary. Frequent wrong word choices.
        - 3-4: Basic vocabulary only, highly repetitive.
        - 5-6: Adequate vocabulary. Some variety but over-reliance on common words.
        - 7-8: Good range including less common words, collocations, topic-specific terms.
        - 9-10: Wide, precise vocabulary including idiomatic and academic language.

        CRITERION 4 — organization (10% weight)
        Evaluate:
        - Paragraph structure and logical flow
        - Coherence and cohesion
        - Use of linking words / connectors
        - Smooth transitions between ideas
        Band descriptors:
        - 1-2: No clear structure. Ideas random and incoherent.
        - 3-4: Weak structure. Ideas loosely organized. Very limited connectors.
        - 5-6: Basic structure present. Some connectors. Paragraphing attempted.
        - 7-8: Clear, logical structure. Well-organized with good cohesive devices.
        - 9-10: Excellent organization. Seamless flow between ideas.

        IMPORTANT: Return ONLY valid JSON. No explanation, no markdown, no extra text.
        All feedback content MUST be in Vietnamese. JSON keys stay in English.
        The field "improvedVersion" MUST be in English.
        Provide the full detailed review following this exact schema:
        {
          "taskFulfillment": <number 0-10>,
          "grammar": <number 0-10>,
          "vocabulary": <number 0-10>,
          "organization": <number 0-10>,
          "criteriaExplanations": {
            "taskFulfillment": "<Vietnamese explanation>",
            "grammar": "<Vietnamese explanation>",
            "vocabulary": "<Vietnamese explanation>",
            "organization": "<Vietnamese explanation>"
          },
          "feedback": ["<Vietnamese string>", "<Vietnamese string>"],
          "summary": "<Vietnamese string>",
          "strengths": ["<Vietnamese string>"],
          "weaknesses": ["<Vietnamese string>"],
          "review": {
            "scoreExplanation": "<Vietnamese string>",
            "mainReasonsForLostPoints": ["<Vietnamese string>"],
            "howToImprove": ["<Vietnamese string>"]
          },
          "mistakes": [
            { "word": "<string>", "type": "grammar|spelling|vocabulary|coherence", "suggestion": "<Vietnamese string>", "explanation": "<Vietnamese string>" }
          ],
          "improvedVersion": "<English improved essay>",
          "weaknessTags": ["<Vietnamese string>"],
          "nextPracticeSuggestions": ["<Vietnamese string>"]
        }
        """;

    private const string SpeakingPromptTemplate = """
        You are a professional VSTEP speaking examiner with 10+ years of experience assessing B1, B2, and C1 candidates.

        Speaking task: {speaking_prompt}

        First transcribe the attached student audio. Then evaluate the transcript strictly based on the official VSTEP Speaking rubric. Score each of the 5 criteria independently on a scale of 0-10 in increments of 0.5.
        Do not calculate the final overall score. The backend will calculate it from the criteria.
        The transcript is auto-generated by you from the audio, so minor transcription uncertainty may exist. Score based on meaning, pronunciation evidence, fluency, and linguistic quality.

        CRITERION 1 — fluencyIdeaDevelopment
        Evaluate:
        - Speaking fluency and natural pace
        - Hesitations, fillers (uh, um), and pauses
        - Ability to develop and expand ideas with examples
        Band descriptors:
        - 1-2: Extremely hesitant, almost no idea development, very fragmented speech.
        - 3-4: Frequent pauses and repetitions, limited idea development.
        - 5-6: Some hesitation but generally able to continue. Basic idea development.
        - 7-8: Speaks with reasonable fluency. Develops ideas with some detail and examples.
        - 9-10: Fully fluent, natural pace. Strong examples and elaboration.

        CRITERION 2 — pronunciation
        Evaluate:
        - Clarity and accuracy of sounds
        - Word-final sounds
        - Word stress and sentence stress
        - Intonation patterns
        - Overall intelligibility
        Band descriptors:
        - 1-2: Very poor pronunciation, largely incoherent.
        - 3-4: Many basic pronunciation issues, hard to understand.
        - 5-6: Reasonably clear, with some pronunciation errors.
        - 7-8: Clear and accurate pronunciation with good intonation.
        - 9-10: Near-native pronunciation.

        CRITERION 3 — vocabulary
        Evaluate:
        - Range and diversity of vocabulary
        - Topic-appropriate words and phrases
        - Use of idioms or less common words (if natural)
        - Avoidance of word-finding difficulties or repetition
        Band descriptors:
        - 1-2: Very limited vocabulary, frequent wrong word choices.
        - 3-4: Basic vocabulary only, repetitive.
        - 5-6: Adequate vocabulary. Some variety but limited range.
        - 7-8: Good range including less common words. Appropriate and accurate.
        - 9-10: Wide, precise vocabulary including idiomatic expressions.

        CRITERION 4 — grammar
        Evaluate:
        - Accuracy of tense and structure usage
        - Range (simple, compound, complex sentences)
        - Basic errors (articles, prepositions, agreement)
        - Whether errors impede understanding
        Band descriptors:
        - 1-2: Only basic structures, systematic errors make speech hard to understand.
        - 3-4: Simple sentences mostly, frequent grammar errors.
        - 5-6: Mix of simple and compound sentences. Errors present but meaning clear.
        - 7-8: Compound and complex sentences, flexible structures, minor errors.
        - 9-10: Wide range used accurately and flexibly.

        CRITERION 5 — contentCoherence
        Evaluate:
        - Relevance to the task / staying on topic
        - Logical arrangement of ideas
        - Use of spoken connectors and discourse markers
        Band descriptors:
        - 1-2: Largely off-topic or too short. No logical organization.
        - 3-4: Attempts the task but frequently off-topic. Weak connectors.
        - 5-6: Generally on-topic. Basic logical organization.
        - 7-8: Clearly addresses the task. Well-organized with appropriate connectors.
        - 9-10: Fully addresses the task with well-supported, logically structured response.

        IMPORTANT: Return ONLY valid JSON. No explanation, no markdown, no extra text.
        All feedback content MUST be in Vietnamese. JSON keys stay in English.
        The field "betterAnswer" MUST be in English.
        "transcript": concise transcript of the student's answer, or empty string if audio is not understandable.
        Provide the full detailed review following this exact schema:
        {
          "fluencyIdeaDevelopment": <number 0-10>,
          "pronunciation": <number 0-10>,
          "vocabulary": <number 0-10>,
          "grammar": <number 0-10>,
          "contentCoherence": <number 0-10>,
          "criteriaExplanations": {
            "fluencyIdeaDevelopment": "<Vietnamese explanation>",
            "pronunciation": "<Vietnamese explanation>",
            "vocabulary": "<Vietnamese explanation>",
            "grammar": "<Vietnamese explanation>",
            "contentCoherence": "<Vietnamese explanation>"
          },
          "feedback": ["<Vietnamese string>"],
          "transcript": "<string>",
          "summary": "<Vietnamese string>",
          "strengths": ["<Vietnamese string>"],
          "weaknesses": ["<Vietnamese string>"],
          "review": {
            "scoreExplanation": "<Vietnamese string>",
            "mainReasonsForLostPoints": ["<Vietnamese string>"],
            "howToImprove": ["<Vietnamese string>"]
          },
          "timestampFeedback": [
            { "startTime": "<string>", "endTime": "<string>", "type": "fluencyIdeaDevelopment|grammar|vocabulary|pronunciation|contentCoherence", "issue": "<Vietnamese string>", "suggestion": "<Vietnamese string>" }
          ],
          "betterAnswer": "<English better answer>",
          "weaknessTags": ["<Vietnamese string>"],
          "nextPracticeSuggestions": ["<Vietnamese string>"]
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
        [JsonPropertyName("overallScore")]
        public decimal? OverallScore { get; set; }

        public JsonElement? Feedback { get; set; }
        public string? Transcript { get; set; }

        // Writing: new primary fields
        public decimal? TaskFulfillment { get; set; }
        public decimal? Grammar { get; set; }
        public decimal? Vocabulary { get; set; }
        public decimal? Organization { get; set; }

        // Writing: legacy aliases
        [JsonPropertyName("task_response")]
        public decimal? TaskResponse { get; set; }
        [JsonPropertyName("taskAchievement")]
        public decimal? TaskAchievement { get; set; }

        // Speaking: new primary fields
        public decimal? FluencyIdeaDevelopment { get; set; }
        public decimal? Pronunciation { get; set; }
        public decimal? ContentCoherence { get; set; }

        // Speaking: legacy aliases
        public decimal? Fluency { get; set; }
        [JsonPropertyName("topicDevelopment")]
        public decimal? TopicDevelopment { get; set; }
        public decimal? Relevance { get; set; }
    }
}
