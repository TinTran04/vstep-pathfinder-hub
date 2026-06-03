using AutoMapper;
using BusinessLogicLayer.DTOs.Writing;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class WritingPracticeService : IWritingPracticeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IOpenRouterGradingService _openRouterGradingService;
    private readonly IRewardService _rewardService;

    public WritingPracticeService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IOpenRouterGradingService openRouterGradingService,
        IRewardService rewardService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _openRouterGradingService = openRouterGradingService;
        _rewardService = rewardService;
    }

    public async Task<WritingSubmissionResponse> SubmitAsync(int userId, int examId, SubmitWritingRequest request)
    {
        var user = await GetExistingUserAsync(userId);
        var exam = await GetPublishedWritingExamAsync(examId);

        if (IsFreeUser(user) && await _unitOfWork.WritingSubmissions.HasSubmittedAsync(userId, exam.ExamId))
        {
            throw new InvalidOperationException("Free users can only submit this exam once.");
        }

        var submission = new WritingSubmission
        {
            UserId = user.UserId,
            ExamId = exam.ExamId,
            Prompt = request.Prompt.Trim(),
            EssayText = request.EssayText.Trim(),
            DurationUsedSeconds = request.DurationUsedSeconds,
            Status = "processing"
        };

        try
        {
            var scoreResult = await _openRouterGradingService.GradeWritingAsync(submission.Prompt, submission.EssayText);
            submission.Score = scoreResult.Score;
            submission.Feedback = scoreResult.Feedback;
            submission.Status = "scored";
        }
        catch (Exception exception) when (exception is InvalidOperationException or HttpRequestException or TaskCanceledException)
        {
            submission.Status = "failed";
            submission.Feedback = "AI grading failed. Please try again later.";
        }

        await _unitOfWork.WritingSubmissions.AddAsync(submission);
        await _unitOfWork.SaveChangesAsync();

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
