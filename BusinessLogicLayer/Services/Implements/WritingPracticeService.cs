using AutoMapper;
using BusinessLogicLayer.DTOs.Writing;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;

using Microsoft.Extensions.Logging;

namespace BusinessLogicLayer.Services.Implements;

public class WritingPracticeService : IWritingPracticeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IAIGradingService _aiGradingService;
    private readonly IRewardService _rewardService;
    private readonly ILogger<WritingPracticeService> _logger;

    public WritingPracticeService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IAIGradingService aiGradingService,
        IRewardService rewardService,
        ILogger<WritingPracticeService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _aiGradingService = aiGradingService;
        _rewardService = rewardService;
        _logger = logger;
    }

    public async Task<WritingSubmissionResponse> SubmitAsync(int userId, int examId, SubmitWritingRequest request)
    {
        var user = await GetExistingUserAsync(userId);
        var exam = await GetPublishedWritingExamAsync(examId);

        if (IsFreeUser(user) && await _unitOfWork.WritingSubmissions.HasSubmittedAsync(userId, exam.ExamId))
        {
            throw new InvalidOperationException("Free users can only submit this exam once.");
        }

        int? currentAttemptId = request.AttemptId;

        // Create standalone practice attempt if no AttemptId provided
        if (currentAttemptId == null)
        {
            var draftMeta = new { _meta = new { mode = "practice_writing" } };
            var newAttempt = new ExamAttempt
            {
                UserId = user.UserId,
                ExamId = exam.ExamId,
                SkillType = "writing",
                Status = "submitted",
                StartedAt = DateTime.UtcNow,
                SubmittedAt = DateTime.UtcNow,
                DurationMinutes = exam.DurationMinutes,
                CurrentSkill = "writing",
                DraftStateJson = System.Text.Json.JsonSerializer.Serialize(draftMeta)
            };
            await _unitOfWork.ExamAttempts.AddAsync(newAttempt);
            await _unitOfWork.SaveChangesAsync();
            currentAttemptId = newAttempt.AttemptId;
        }

        var submission = new WritingSubmission
        {
            UserId = user.UserId,
            ExamId = exam.ExamId,
            Prompt = request.Prompt.Trim(),
            EssayText = request.EssayText.Trim(),
            DurationUsedSeconds = request.DurationUsedSeconds,
            AttemptId = currentAttemptId,
            Status = "processing"
        };

        await _unitOfWork.WritingSubmissions.AddAsync(submission);
        await _unitOfWork.SaveChangesAsync();

        try
        {
            var scoreResult = await _aiGradingService.GradeWritingAsync(user.UserId, submission.WritingSubmissionId, submission.Prompt, submission.EssayText);
            submission.Score = scoreResult.Score;
            submission.Feedback = scoreResult.Feedback;
            submission.FeedbackJson = scoreResult.FeedbackJson;
            submission.Status = "scored";
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Writing AI grading failed. SubmissionId={SubmissionId}", submission.WritingSubmissionId);
            submission.Status = "failed";
            submission.Feedback = "AI grading failed. Please try again later.";
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
                "writing_submission",
                submission.WritingSubmissionId,
                exam.ExamMode,
                submission.Score);
        }

        return _mapper.Map<WritingSubmissionResponse>(submission);
    }

    public async Task<WritingResultResponse> GetSubmissionAsync(int userId, int submissionId)
    {
        var submission = await _unitOfWork.WritingSubmissions.GetByIdAsync(submissionId);

        if (submission is null || submission.UserId != userId)
        {
            throw new KeyNotFoundException("Writing submission not found.");
        }

        return _mapper.Map<WritingResultResponse>(submission);
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

    private async Task<Exam> GetPublishedWritingExamAsync(int examId)
    {
        var exam = await _unitOfWork.Exams.GetDetailByIdAsync(examId);

        if (exam is null)
        {
            throw new KeyNotFoundException("Exam not found.");
        }

        if (exam.SkillType != "writing")
        {
            throw new InvalidOperationException("Exam is not a writing practice exam.");
        }

        return exam;
    }

    private static bool IsFreeUser(User user)
    {
        return user.SubscriptionPlanId == 1 || user.SubscriptionPlan.Name == "free";
    }
}
