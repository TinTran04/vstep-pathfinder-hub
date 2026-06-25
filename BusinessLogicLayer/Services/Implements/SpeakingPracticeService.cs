using AutoMapper;
using BusinessLogicLayer.DTOs.AI;
using BusinessLogicLayer.DTOs.Speaking;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;
using Microsoft.Extensions.Logging;

namespace BusinessLogicLayer.Services.Implements;

public class SpeakingPracticeService : ISpeakingPracticeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IR2StorageService _r2StorageService;
    private readonly IAIGradingService _aiGradingService;
    private readonly IRewardService _rewardService;
    private readonly ILogger<SpeakingPracticeService> _logger;

    public SpeakingPracticeService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IR2StorageService r2StorageService,
        IAIGradingService aiGradingService,
        IRewardService rewardService,
        ILogger<SpeakingPracticeService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _r2StorageService = r2StorageService;
        _aiGradingService = aiGradingService;
        _rewardService = rewardService;
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
            var gradingAudioUrl = await _r2StorageService.CreateReadUrlAsync(submission.AudioObjectKey);
            var scoreResult = await _aiGradingService.GradeSpeakingAsync(
                user.UserId,
                submission.SpeakingSubmissionId,
                exam.Description,
                null,
                gradingAudioUrl,
                submission.AudioObjectKey);
            submission.Score = scoreResult.Score;
            submission.Feedback = BuildSpeakingFeedback(scoreResult);
            submission.FeedbackJson = scoreResult.FeedbackJson;
            submission.Transcript = scoreResult.Transcript;
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
            submission.Feedback = "Hệ thống chấm điểm AI đang tạm thời không khả dụng. Vui lòng thử lại sau.";
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
}
