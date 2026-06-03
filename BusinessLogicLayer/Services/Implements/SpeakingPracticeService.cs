using AutoMapper;
using BusinessLogicLayer.DTOs.AI;
using BusinessLogicLayer.DTOs.Speaking;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class SpeakingPracticeService : ISpeakingPracticeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IR2StorageService _r2StorageService;
    private readonly IOpenRouterGradingService _openRouterGradingService;
    private readonly IRewardService _rewardService;

    public SpeakingPracticeService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IR2StorageService r2StorageService,
        IOpenRouterGradingService openRouterGradingService,
        IRewardService rewardService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _r2StorageService = r2StorageService;
        _openRouterGradingService = openRouterGradingService;
        _rewardService = rewardService;
    }

    public async Task<SpeakingUploadUrlResponse> CreateUploadUrlAsync(int userId, CreateSpeakingUploadUrlRequest request)
    {
        _ = await GetExistingUserAsync(userId);
        var exam = await GetPublishedSpeakingExamAsync(request.ExamId);
        var (uploadUrl, objectKey, expiresAt) = await _r2StorageService.CreateSpeakingUploadUrlAsync(userId, exam.ExamId, request.ContentType);

        return new SpeakingUploadUrlResponse
        {
            UploadUrl = uploadUrl,
            AudioObjectKey = objectKey,
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

        var submission = new SpeakingSubmission
        {
            UserId = user.UserId,
            ExamId = exam.ExamId,
            AudioObjectKey = request.AudioObjectKey.Trim(),
            AudioUrl = string.IsNullOrWhiteSpace(request.AudioUrl)
                ? _r2StorageService.GetObjectUrl(request.AudioObjectKey.Trim())
                : request.AudioUrl.Trim(),
            DurationUsedSeconds = request.DurationUsedSeconds,
            Status = "processing",
            AutoDeleteAt = GetAutoDeleteAt(user)
        };

        try
        {
            var scoreResult = await _openRouterGradingService.GradeSpeakingAsync(submission.AudioUrl, submission.AudioObjectKey);
            submission.Score = scoreResult.Score;
            submission.Feedback = BuildSpeakingFeedback(scoreResult);
            submission.Status = "scored";
        }
        catch (Exception exception) when (exception is InvalidOperationException or HttpRequestException or TaskCanceledException)
        {
            submission.Status = "failed";
            submission.Feedback = "AI grading failed. Please try again later.";
        }

        await _unitOfWork.SpeakingSubmissions.AddAsync(submission);
        await _unitOfWork.SaveChangesAsync();

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
