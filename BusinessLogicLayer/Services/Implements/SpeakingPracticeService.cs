using AutoMapper;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.DTOs.AI;
using BusinessLogicLayer.DTOs.Speaking;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace BusinessLogicLayer.Services.Implements;

public class SpeakingPracticeService : ISpeakingPracticeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IR2StorageService _r2StorageService;
    private readonly ISpeechToTextService _speechToTextService;
    private readonly IAIGradingService _aiGradingService;
    private readonly IRewardService _rewardService;
    private readonly AiSettings _aiSettings;
    private readonly DeepgramSettings _deepgramSettings;
    private readonly ILogger<SpeakingPracticeService> _logger;

    public SpeakingPracticeService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IR2StorageService r2StorageService,
        ISpeechToTextService speechToTextService,
        IAIGradingService aiGradingService,
        IRewardService rewardService,
        IOptions<AiSettings> aiOptions,
        IOptions<DeepgramSettings> deepgramOptions,
        ILogger<SpeakingPracticeService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _r2StorageService = r2StorageService;
        _speechToTextService = speechToTextService;
        _aiGradingService = aiGradingService;
        _rewardService = rewardService;
        _aiSettings = aiOptions.Value;
        _deepgramSettings = deepgramOptions.Value;
        _logger = logger;
    }

    public async Task<SpeakingUploadUrlResponse> CreateUploadUrlAsync(int userId, CreateSpeakingUploadUrlRequest request)
    {
        _ = await GetExistingUserAsync(userId);
        var exam = await GetPublishedSpeakingExamAsync(request.ExamId);
        var (uploadUrl, objectKey, contentType, expiresAt) = await _r2StorageService.CreateSpeakingUploadUrlAsync(userId, exam.ExamId, request.ContentType);

        return new SpeakingUploadUrlResponse
        {
            UploadUrl = uploadUrl,
            AudioObjectKey = objectKey,
            ContentType = contentType,
            ExpiresAt = expiresAt
        };
    }

    public async Task<SpeakingSubmissionResponse> SubmitAsync(int userId, int examId, SubmitSpeakingRequest request)
    {
        var user = await GetExistingUserAsync(userId);
        var exam = await GetPublishedSpeakingExamAsync(examId);

        if (IsFreeUser(user) && await _unitOfWork.SpeakingSubmissions.HasSubmittedAsync(userId, exam.ExamId))
        {
            throw new InvalidOperationException("Free users can only submit this exam once.");
        }

        int? currentAttemptId = request.AttemptId;

        // Create standalone practice attempt if no AttemptId provided
        if (currentAttemptId == null)
        {
            var draftMeta = new { _meta = new { mode = "practice_speaking" } };
            var newAttempt = new ExamAttempt
            {
                UserId = user.UserId,
                ExamId = exam.ExamId,
                SkillType = "speaking",
                Status = "submitted",
                StartedAt = DateTime.UtcNow,
                SubmittedAt = DateTime.UtcNow,
                DurationMinutes = exam.DurationMinutes,
                CurrentSkill = "speaking",
                DraftStateJson = System.Text.Json.JsonSerializer.Serialize(draftMeta)
            };
            await _unitOfWork.ExamAttempts.AddAsync(newAttempt);
            await _unitOfWork.SaveChangesAsync();
            currentAttemptId = newAttempt.AttemptId;
        }

        var submission = new SpeakingSubmission
        {
            UserId = user.UserId,
            ExamId = exam.ExamId,
            AudioObjectKey = request.AudioObjectKey.Trim(),
            AudioUrl = string.IsNullOrWhiteSpace(request.AudioUrl)
                ? _r2StorageService.GetObjectUrl(request.AudioObjectKey.Trim())
                : request.AudioUrl.Trim(),
            DurationUsedSeconds = request.DurationUsedSeconds,
            AttemptId = currentAttemptId,
            Status = "processing",
            AutoDeleteAt = GetAutoDeleteAt(user)
        };

        await _unitOfWork.SpeakingSubmissions.AddAsync(submission);
        await _unitOfWork.SaveChangesAsync();

        try
        {
            var fullPrompt = exam.Description ?? "";
            if (exam.Sections != null && exam.Sections.Any())
            {
                var sectionPrompts = exam.Sections.Select(s => $"{s.Title}\n{s.Instruction}\n{s.PassageText}".Trim());
                fullPrompt += "\n\nExam Details:\n---\n" + string.Join("\n---\n", sectionPrompts.Where(p => !string.IsNullOrEmpty(p)));
            }

            if (!_aiSettings.SpeakingUseStt)
            {
                throw new InvalidOperationException("Speaking STT grading is disabled.");
            }

            SttResult sttResult;
            try
            {
                await using var audioStream = await _r2StorageService.DownloadObjectStreamAsync(submission.AudioObjectKey);
                sttResult = await _speechToTextService.TranscribeAsync(
                    audioStream,
                    InferContentType(submission.AudioObjectKey, submission.AudioUrl));
                submission.Transcript = sttResult.Transcript;
                await LogSttUsageAsync(user.UserId, submission.SpeakingSubmissionId, "success", null);
            }
            catch (Exception sttException)
            {
                await LogSttUsageAsync(user.UserId, submission.SpeakingSubmissionId, "failed", sttException.Message);
                throw new InvalidOperationException("Speech-to-text provider failed.", sttException);
            }

            if (!HasMinimumEnglishWords(sttResult.Transcript))
            {
                var invalidResult = BuildInvalidSpeakingAudioResult(sttResult.Transcript);
                submission.Score = invalidResult.Score;
                submission.Feedback = invalidResult.Feedback;
                submission.FeedbackJson = invalidResult.FeedbackJson;
                submission.Transcript = sttResult.Transcript;
                submission.Status = "scored";
                await _unitOfWork.SaveChangesAsync();
                return _mapper.Map<SpeakingSubmissionResponse>(submission);
            }

            var scoreResult = await _aiGradingService.GradeSpeakingAsync(
                user.UserId,
                submission.SpeakingSubmissionId,
                fullPrompt.Trim(),
                sttResult.Transcript);
            submission.Score = scoreResult.Score;
            submission.Feedback = BuildSpeakingFeedback(scoreResult);
            submission.FeedbackJson = scoreResult.FeedbackJson;
            submission.Transcript = string.IsNullOrWhiteSpace(scoreResult.Transcript)
                ? sttResult.Transcript
                : scoreResult.Transcript;
            submission.Status = "scored";
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Speaking AI grading failed for UserId={UserId}, ExamId={ExamId}, AudioObjectKey={AudioObjectKey}",
                userId,
                exam.ExamId,
                submission.AudioObjectKey);
            submission.Status = "failed";
            submission.Feedback = "Hệ thống xử lý giọng nói đang tạm lỗi. Vui lòng thử lại sau.";
        }

        await _unitOfWork.SaveChangesAsync();

        if (request.AttemptId == null && currentAttemptId.HasValue)
        {
            var attempt = await _unitOfWork.ExamAttempts.GetByIdAsync(currentAttemptId.Value);
            if (attempt != null)
            {
                attempt.Status = submission.Status;
                attempt.Score = submission.Score;
                attempt.CompletedAt = DateTime.UtcNow;
                _unitOfWork.ExamAttempts.Update(attempt);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        if (submission.Status == "scored")
        {
            await _rewardService.AwardActivityRewardsAsync(
                userId,
                "speaking_submission",
                submission.SpeakingSubmissionId,
                exam.ExamMode,
                submission.Score);
        }

        return _mapper.Map<SpeakingSubmissionResponse>(submission);
    }

    public async Task<SpeakingResultResponse> GetSubmissionAsync(int userId, int submissionId)
    {
        var submission = await _unitOfWork.SpeakingSubmissions.GetByIdAsync(submissionId);

        if (submission is null || submission.UserId != userId)
        {
            throw new KeyNotFoundException("Speaking submission not found.");
        }

        return _mapper.Map<SpeakingResultResponse>(submission);
    }

    public async Task<(string ObjectKey, string ObjectUrl)> UploadAudioAsync(int userId, int examId, Stream fileStream, string contentType)
    {
        var user = await GetExistingUserAsync(userId);
        var exam = await GetPublishedSpeakingExamAsync(examId);

        var (objectKey, objectUrl) = await _r2StorageService.UploadSpeakingAudioAsync(userId, examId, fileStream, contentType);

        return (objectKey, objectUrl);
    }

    private async Task<User> GetExistingUserAsync(int userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);

        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        return user;
    }

    private async Task<Exam> GetPublishedSpeakingExamAsync(int examId)
    {
        var exam = await _unitOfWork.Exams.GetDetailByIdAsync(examId);

        if (exam is null)
        {
            throw new KeyNotFoundException("Exam not found.");
        }

        if (exam.SkillType != "speaking")
        {
            throw new InvalidOperationException("Exam is not a speaking practice exam.");
        }

        return exam;
    }

    private static bool IsFreeUser(User user)
    {
        return user.SubscriptionPlanId == 1 || user.SubscriptionPlan.Name == "free";
    }

    private static DateTime? GetAutoDeleteAt(User user)
    {
        if (user.SubscriptionPlan.CanStoreSpeakingAudioForever)
        {
            return null;
        }

        var retentionDays = user.SubscriptionPlan.SpeakingAudioRetentionDays > 0
            ? user.SubscriptionPlan.SpeakingAudioRetentionDays
            : 4;

        return DateTime.UtcNow.AddDays(retentionDays);
    }

    private static string? BuildSpeakingFeedback(AiScoreResult scoreResult)
    {
        if (string.IsNullOrWhiteSpace(scoreResult.Transcript))
        {
            return scoreResult.Feedback;
        }

        var feedback = string.IsNullOrWhiteSpace(scoreResult.Feedback)
            ? string.Empty
            : scoreResult.Feedback.Trim();
        var transcript = scoreResult.Transcript.Trim();
        var combined = $"{feedback}\nTranscript: {transcript}".Trim();

        return combined.Length <= 1800 ? combined : combined[..1800];
    }

    private async Task LogSttUsageAsync(int userId, int submissionId, string status, string? errorMessage)
    {
        try
        {
            await _unitOfWork.AiUsageLogs.AddAsync(new AiUsageLog
            {
                UserId = userId,
                SubmissionId = submissionId,
                SkillType = "speaking",
                ActionType = "stt",
                PrimaryProvider = _aiSettings.SttPrimaryProvider,
                ProviderUsed = "DEEPGRAM",
                ModelUsed = string.IsNullOrWhiteSpace(_deepgramSettings.Model) ? "nova-3" : _deepgramSettings.Model.Trim(),
                FallbackUsed = false,
                Status = status,
                ErrorMessage = string.IsNullOrWhiteSpace(errorMessage)
                    ? null
                    : errorMessage.Length <= 500 ? errorMessage : errorMessage[..500]
            });
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Failed to save STT usage log.");
        }
    }

    private static bool HasMinimumEnglishWords(string? transcript)
    {
        if (string.IsNullOrWhiteSpace(transcript))
        {
            return false;
        }

        return Regex.Matches(transcript, @"\b[A-Za-z][A-Za-z']+\b").Count >= 3;
    }

    private static string InferContentType(string? audioObjectKey, string? audioUrl)
    {
        var source = !string.IsNullOrWhiteSpace(audioObjectKey) ? audioObjectKey : audioUrl ?? string.Empty;
        var extension = Path.GetExtension(source.Split('?', '#')[0]).ToLowerInvariant();

        return extension switch
        {
            ".wav" => "audio/wav",
            ".mp3" => "audio/mpeg",
            ".m4a" => "audio/mp4",
            ".mp4" => "audio/mp4",
            ".ogg" => "audio/ogg",
            ".oga" => "audio/ogg",
            ".flac" => "audio/flac",
            _ => "audio/webm"
        };
    }

    private static AiScoreResult BuildInvalidSpeakingAudioResult(string? transcript)
    {
        const string message = "Khong du du lieu giong noi de cham. Vui long ghi am ro hon.";
        var feedbackJson = JsonSerializer.Serialize(new
        {
            fluencyIdeaDevelopment = 0,
            pronunciation = 0,
            vocabulary = 0,
            grammar = 0,
            contentCoherence = 0,
            criteriaExplanations = new
            {
                fluencyIdeaDevelopment = message,
                pronunciation = message,
                vocabulary = message,
                grammar = message,
                contentCoherence = message
            },
            feedback = new[] { message },
            transcript = transcript ?? string.Empty,
            summary = message,
            strengths = Array.Empty<string>(),
            weaknesses = new[] { "Ban ghi am qua ngan hoac khong co du tu tieng Anh ro rang." },
            review = new
            {
                scoreExplanation = message,
                mainReasonsForLostPoints = new[] { "Khong co du du lieu giong noi de danh gia." },
                howToImprove = new[] { "Ghi am lai trong moi truong yen tinh va noi toi thieu vai cau tieng Anh ro rang." }
            },
            timestampFeedback = Array.Empty<object>(),
            betterAnswer = string.Empty,
            weaknessTags = new[] { "Thieu du lieu ghi am" },
            nextPracticeSuggestions = new[] { "Kiem tra microphone va ghi am lai cau tra loi day du." }
        });

        return new AiScoreResult
        {
            Score = 0,
            Feedback = message,
            Transcript = transcript,
            FeedbackJson = feedbackJson,
            FluencyIdeaDevelopment = 0,
            Pronunciation = 0,
            Vocabulary = 0,
            Grammar = 0,
            ContentCoherence = 0,
            FeedbackPoints = new List<string> { message }
        };
    }
}
