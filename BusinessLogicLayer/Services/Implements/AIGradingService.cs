using System.Text.Json;
using System.Text.Json.Serialization;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.DTOs.AI;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements;

public class AIGradingService : IAIGradingService
{
    private readonly IEnumerable<IAIProvider> _providers;
    private readonly AiSettings _settings;
    private readonly OpenRouterSettings _orSettings;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AIGradingService> _logger;
    private readonly HttpClient _httpClient;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    public AIGradingService(
        IEnumerable<IAIProvider> providers,
        IOptions<AiSettings> settings,
        IOptions<OpenRouterSettings> orSettings,
        IUnitOfWork unitOfWork,
        ILogger<AIGradingService> logger,
        HttpClient httpClient)
    {
        _providers = providers;
        _settings = settings.Value;
        _orSettings = orSettings.Value;
        _unitOfWork = unitOfWork;
        _logger = logger;
        _httpClient = httpClient;
    }

    public Task<AiScoreResult> GradeWritingAsync(int userId, int submissionId, string prompt, string essayText, CancellationToken cancellationToken = default)
    {
        var chatRequest = new AiChatRequest
        {
            Temperature = 0.1,
            MaxTokens = 2500,
            ResponseFormat = new { type = "json_object" },
            Messages = new List<AiChatMessage>
            {
                new()
                {
                    Role = "user",
                    Content = BuildWritingPrompt(prompt, essayText)
                }
            }
        };

        return SendChatRequestWithFallbackAsync(userId, submissionId, "writing", "writing_grading", chatRequest, cancellationToken);
    }

    public async Task<AiScoreResult> GradeSpeakingAsync(int userId, int submissionId, string speakingPrompt, string? transcript = null, string? audioUrl = null, string? audioObjectKey = null, CancellationToken cancellationToken = default)
    {
        var prompt = BuildSpeakingPrompt(speakingPrompt);
        var chatRequest = new AiChatRequest
        {
            Temperature = 0.1,
            MaxTokens = 2500,
            ResponseFormat = new { type = "json_object" }
        };

        if (!string.IsNullOrWhiteSpace(transcript))
        {
            chatRequest.Messages = new List<AiChatMessage>
            {
                new()
                {
                    Role = "user",
                    Content = prompt + "\n\nStudent Transcript:\n---\n" + transcript + "\n---\n"
                }
            };
        }
        else if (!string.IsNullOrWhiteSpace(audioUrl))
        {
            var audioBytes = await DownloadAudioAsync(audioUrl, cancellationToken);
            var base64Audio = Convert.ToBase64String(audioBytes);
            var format = InferAudioFormat(audioObjectKey, audioUrl);

            chatRequest.Messages = new List<AiChatMessage>
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
            };
        }
        else
        {
            throw new ArgumentException("Either transcript or audioUrl must be provided.");
        }

        return await SendChatRequestWithFallbackAsync(userId, submissionId, "speaking", "speaking_grading", chatRequest, cancellationToken);
    }

    private string _currentSkillType = "writing";

    private async Task<AiScoreResult> SendChatRequestWithFallbackAsync(int userId, int submissionId, string skillType, string actionType, AiChatRequest request, CancellationToken cancellationToken)
    {
        var primaryProviderName = _settings.PrimaryProvider?.ToUpperInvariant() ?? "OPENROUTER";
        var primaryProvider = _providers.FirstOrDefault(p => p.ProviderName == primaryProviderName)
            ?? throw new InvalidOperationException($"Primary AI provider '{primaryProviderName}' is not registered.");

        var fallbackProviderName = _settings.FallbackProvider?.ToUpperInvariant();
        var fallbackProvider = string.IsNullOrWhiteSpace(fallbackProviderName) ? null : _providers.FirstOrDefault(p => p.ProviderName == fallbackProviderName);

        var log = new AiUsageLog
        {
            UserId = userId,
            SubmissionId = submissionId,
            SkillType = skillType,
            ActionType = actionType,
            PrimaryProvider = primaryProviderName
        };

        AiProviderResponse primaryResult = null!;
        Exception? primaryException = null;

        try
        {
            primaryResult = await primaryProvider.SendChatRequestAsync(request, cancellationToken);
            if (!primaryResult.IsSuccess && CanFallback(primaryResult.StatusCode))
            {
                primaryException = new Exception($"HTTP {primaryResult.StatusCode}");
            }
        }
        catch (Exception ex) when (IsNetworkOrTimeout(ex))
        {
            primaryException = ex;
        }

        _currentSkillType = skillType;

        if (primaryException == null && primaryResult != null && primaryResult.IsSuccess)
        {
            try
            {
                var parsedResult = ParseScoreResult(primaryResult.Content);
                log.ProviderUsed = primaryProviderName;
                log.ModelUsed = request.Model ?? "default";
                log.FallbackUsed = false;
                log.Status = "success";
                log.InputTokens = primaryResult.InputTokens;
                log.OutputTokens = primaryResult.OutputTokens;
                await SaveLogAsync(log);
                return parsedResult;
            }
            catch (Exception ex)
            {
                var snippet = primaryResult.Content.Length > 200 ? primaryResult.Content[..200] : primaryResult.Content;
                primaryException = new Exception($"JSON Parse Error: {ex.Message}. Raw snippet: {snippet}");
            }
        }

        if (fallbackProvider != null && (primaryException != null && (primaryResult == null || CanFallback(primaryResult.StatusCode))))
        {
            try
            {
                var fallbackResult = await fallbackProvider.SendChatRequestAsync(request, cancellationToken);
                if (fallbackResult.IsSuccess)
                {
                    try
                    {
                        var parsedResult = ParseScoreResult(fallbackResult.Content);
                        log.ProviderUsed = fallbackProviderName;
                        log.ModelUsed = request.Model ?? "default";
                        log.FallbackUsed = true;
                        log.Status = "fallback_success";
                        log.InputTokens = fallbackResult.InputTokens;
                        log.OutputTokens = fallbackResult.OutputTokens;
                        log.ErrorMessage = "Primary failed: " + primaryException.Message;
                        await SaveLogAsync(log);
                        return parsedResult;
                    }
                    catch (Exception ex)
                    {
                        var snippet = fallbackResult.Content.Length > 200 ? fallbackResult.Content[..200] : fallbackResult.Content;
                        log.ErrorMessage = $"Primary failed: {primaryException.Message}. Fallback JSON Parse Error: {ex.Message}. Raw snippet: {snippet}";
                    }
                }
                
                log.ProviderUsed = fallbackProviderName;
                log.FallbackUsed = true;
                log.Status = "fallback_failed";
                log.ErrorMessage = $"Primary: {primaryException.Message} | Fallback HTTP {fallbackResult.StatusCode}";
                await SaveLogAsync(log);
                throw new InvalidOperationException("Both Primary and Fallback AI providers failed.");
            }
            catch (Exception ex)
            {
                log.ProviderUsed = fallbackProviderName;
                log.FallbackUsed = true;
                log.Status = "fallback_failed";
                log.ErrorMessage = $"Primary: {primaryException.Message} | Fallback Error: {ex.Message}";
                await SaveLogAsync(log);
                throw;
            }
        }

        log.ProviderUsed = primaryProviderName;
        log.FallbackUsed = false;
        log.Status = "failed";
        
        var baseErrorMessage = primaryException?.Message ?? (primaryResult != null ? $"HTTP {primaryResult.StatusCode}" : "Unknown error");
        if (fallbackProvider == null && primaryResult != null && CanFallback(primaryResult.StatusCode))
        {
            log.ErrorMessage = $"{baseErrorMessage} - fallback disabled";
        }
        else
        {
            log.ErrorMessage = baseErrorMessage;
        }
        
        await SaveLogAsync(log);
        
        if (primaryException != null && primaryResult == null) throw primaryException;
        if (primaryResult != null && !primaryResult.IsSuccess)
        {
            var providerMessage = ExtractProviderError(primaryResult.RawResponse);
            throw new InvalidOperationException($"AI request failed with HTTP {primaryResult.StatusCode}. {providerMessage}");
        }
        
        throw new InvalidOperationException($"AI request failed. {log.ErrorMessage}");
    }

    private static string ExtractProviderError(string rawResponse)
    {
        if (string.IsNullOrWhiteSpace(rawResponse)) return "Provider response body is empty.";
        try
        {
            using var document = JsonDocument.Parse(rawResponse);
            if (document.RootElement.TryGetProperty("error", out var error))
            {
                if (error.ValueKind == JsonValueKind.Object && error.TryGetProperty("message", out var message) && message.ValueKind == JsonValueKind.String)
                {
                    return message.GetString() ?? rawResponse;
                }
                if (error.ValueKind == JsonValueKind.String) return error.GetString() ?? rawResponse;
            }
        }
        catch (JsonException) { }
        return rawResponse.Length > 500 ? rawResponse[..500] : rawResponse;
    }

    private bool CanFallback(int statusCode)
    {
        return statusCode == 402
            || statusCode == 429
            || (statusCode >= 500 && statusCode <= 504);
    }

    private bool IsNetworkOrTimeout(Exception ex)
    {
        return ex is TaskCanceledException || ex is HttpRequestException;
    }

    private async Task SaveLogAsync(AiUsageLog log)
    {
        try
        {
            await _unitOfWork.AiUsageLogs.AddAsync(log);
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save AI usage log.");
        }
    }


    private AiScoreResult ParseScoreResult(string content)
    {
        _logger.LogInformation("ParseScoreResult: Raw provider content length = {Length}, skillType = {SkillType}", content.Length, _currentSkillType);
        
        var json = ExtractJsonObject(content);
        _logger.LogInformation("ParseScoreResult: Extracted JSON length = {Length}", json.Length);

        AiScoreResponse? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<AiScoreResponse>(json, JsonOptions);
            if (parsed == null) throw new JsonException("Deserialized object is null.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ParseScoreResult: Failed to deserialize JSON. Raw JSON snippet: {JsonSnippet}", 
                json.Length > 500 ? json[..500] : json);
            throw new InvalidOperationException($"Grading response is not valid JSON. {ex.Message}");
        }

        // ── Resolve criteria (new field ?? legacy aliases), clamp 0–10 ──
        // Writing criteria
        var tf = ClampNullable(parsed.TaskFulfillment ?? parsed.TaskResponse ?? parsed.TaskAchievement);
        var gr = ClampNullable(parsed.Grammar);
        var vo = ClampNullable(parsed.Vocabulary);
        var org = ClampNullable(parsed.Organization);

        // Speaking criteria
        var fid = ClampNullable(parsed.FluencyIdeaDevelopment ?? parsed.Fluency);
        var pr = ClampNullable(parsed.Pronunciation);
        var cc = ClampNullable(parsed.ContentCoherence ?? parsed.TopicDevelopment ?? parsed.Relevance);

        // ── Backend calculates score from rubric ──
        decimal score;
        var aiFallbackScore = parsed.Score ?? parsed.OverallScore ?? parsed.Overall;

        if (_currentSkillType == "writing" && tf.HasValue && gr.HasValue && vo.HasValue && org.HasValue)
        {
            score = Math.Clamp((tf.Value * 2m + gr.Value * 1m + vo.Value * 0.6m + org.Value * 0.4m) / 4m, 0, 10);
        }
        else if (_currentSkillType == "speaking" && fid.HasValue && pr.HasValue && vo.HasValue && gr.HasValue && cc.HasValue)
        {
            score = Math.Clamp((fid.Value + pr.Value + vo.Value + gr.Value + cc.Value) / 5m, 0, 10);
        }
        else if (aiFallbackScore.HasValue)
        {
            _logger.LogWarning("ParseScoreResult: Missing criteria for {SkillType}, falling back to AI score {Score}. " +
                "tf={Tf} gr={Gr} vo={Vo} org={Org} fid={Fid} pr={Pr} cc={Cc}",
                _currentSkillType, aiFallbackScore.Value, tf, gr, vo, org, fid, pr, cc);
            score = Math.Clamp(aiFallbackScore.Value, 0, 10);
        }
        else
        {
            throw new InvalidOperationException("Grading response does not contain enough data to calculate a score.");
        }

        // ── Parse feedback points ──
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
            throw new InvalidOperationException("Grading response does not contain JSON.");
        }

        return trimmed[start..(end + 1)];
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

    private async Task<byte[]> DownloadAudioAsync(string audioUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(audioUrl) || !Uri.TryCreate(audioUrl, UriKind.Absolute, out var uri))
        {
            throw new InvalidOperationException("A valid speaking audio URL is required for grading.");
        }

        using var response = await _httpClient.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        var maxBytes = _orSettings.MaxAudioBytes > 0 ? _orSettings.MaxAudioBytes : 15728640;
        if (response.Content.Headers.ContentLength > maxBytes)
        {
            throw new InvalidOperationException("Speaking audio is too large for AI grading.");
        }

        await using var source = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var destination = new MemoryStream();
        var buffer = new byte[81920];
        int read;
        while ((read = await source.ReadAsync(buffer, cancellationToken)) > 0)
        {
            if (destination.Length + read > maxBytes)
            {
                throw new InvalidOperationException("Speaking audio is too large for AI grading.");
            }

            await destination.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }

        return destination.ToArray();
    }

    private static string InferAudioFormat(string? audioObjectKey, string? audioUrl)
    {
        var source = !string.IsNullOrWhiteSpace(audioObjectKey) ? audioObjectKey : (audioUrl ?? string.Empty);
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
            "taskFulfillment": "<Vietnamese explanation for this score>",
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

    private sealed class AiScoreResponse
    {
        // ── Score (AI may still return it; used as fallback) ──
        public decimal? Score { get; set; }
        public decimal? Overall { get; set; }
        [JsonPropertyName("overallScore")]
        public decimal? OverallScore { get; set; }

        public JsonElement? Feedback { get; set; }
        public string? Transcript { get; set; }

        // ── Writing: new primary fields ──
        public decimal? TaskFulfillment { get; set; }
        public decimal? Grammar { get; set; }
        public decimal? Vocabulary { get; set; }
        public decimal? Organization { get; set; }

        // ── Writing: legacy aliases ──
        [JsonPropertyName("task_response")]
        public decimal? TaskResponse { get; set; }
        [JsonPropertyName("taskAchievement")]
        public decimal? TaskAchievement { get; set; }

        // ── Speaking: new primary fields ──
        public decimal? FluencyIdeaDevelopment { get; set; }
        public decimal? Pronunciation { get; set; }
        public decimal? ContentCoherence { get; set; }

        // ── Speaking: legacy aliases ──
        public decimal? Fluency { get; set; }
        [JsonPropertyName("topicDevelopment")]
        public decimal? TopicDevelopment { get; set; }
        public decimal? Relevance { get; set; }
    }
}
