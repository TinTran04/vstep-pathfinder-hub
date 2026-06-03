using AutoMapper;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class PracticeService : IPracticeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IRewardService _rewardService;

    public PracticeService(IUnitOfWork unitOfWork, IMapper mapper, IRewardService rewardService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _rewardService = rewardService;
    }

    public async Task<StartPracticeResponse> StartPracticeAsync(int userId, int examId, string expectedSkillType)
    {
        var user = await GetExistingUserAsync(userId);
        var exam = await GetPublishedExamAsync(examId, expectedSkillType);

        var attempt = new ExamAttempt
        {
            UserId = user.UserId,
            ExamId = exam.ExamId,
            SkillType = expectedSkillType,
            Status = "in_progress",
            StartedAt = DateTime.UtcNow
        };

        await _unitOfWork.ExamAttempts.AddAsync(attempt);
        await _unitOfWork.SaveChangesAsync();

        return new StartPracticeResponse
        {
            AttemptId = attempt.AttemptId,
            ExamId = exam.ExamId,
            SkillType = attempt.SkillType,
            Status = attempt.Status,
            StartedAt = attempt.StartedAt,
            Exam = HideAnswers(_mapper.Map<ExamDetailResponse>(exam))
        };
    }

    public async Task<SubmitPracticeResponse> SubmitPracticeAsync(
        int userId,
        int attemptId,
        string expectedSkillType,
        IReadOnlyList<SubmitAnswerRequest> answers,
        int durationUsedSeconds)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetByIdAsync(attemptId);

        if (attempt is null || attempt.UserId != userId)
        {
            throw new KeyNotFoundException("Attempt not found.");
        }

        if (attempt.SkillType != expectedSkillType || attempt.Exam?.SkillType != expectedSkillType)
        {
            throw new InvalidOperationException("Attempt skill type is invalid.");
        }

        if (attempt.Status != "in_progress")
        {
            throw new InvalidOperationException("Attempt has already been submitted.");
        }

        var user = await GetExistingUserAsync(userId);

        if (IsFreeUser(user) && await _unitOfWork.ExamAttempts.HasSubmittedAttemptAsync(userId, attempt.ExamId))
        {
            throw new InvalidOperationException("Free users can only submit this exam once.");
        }

        var questions = await _unitOfWork.Exams.GetQuestionsForScoringAsync(attempt.ExamId);

        if (questions.Count == 0)
        {
            throw new InvalidOperationException("Exam has no scorable questions.");
        }

        var answerMap = answers
            .GroupBy(answer => answer.QuestionId)
            .ToDictionary(group => group.Key, group => group.First().UserAnswer.Trim());

        var correctCount = 0;
        decimal totalScore = 0;

        foreach (var question in questions)
        {
            answerMap.TryGetValue(question.QuestionId, out var userAnswer);
            userAnswer ??= string.Empty;

            var isCorrect = IsAnswerCorrect(question, userAnswer);
            var answerScore = isCorrect ? question.Score : 0;

            if (isCorrect)
            {
                correctCount++;
                totalScore += answerScore;
            }

            await _unitOfWork.ExamAttempts.AddAnswerAsync(new ExamAttemptAnswer
            {
                AttemptId = attempt.AttemptId,
                QuestionId = question.QuestionId,
                UserAnswer = userAnswer,
                IsCorrect = isCorrect,
                Score = answerScore
            });
        }

        attempt.Status = "scored";
        attempt.SubmittedAt = DateTime.UtcNow;
        attempt.TotalQuestions = questions.Count;
        attempt.CorrectCount = correctCount;
        attempt.Score = totalScore;
        attempt.DurationUsedSeconds = durationUsedSeconds;

        _unitOfWork.ExamAttempts.Update(attempt);
        await _unitOfWork.SaveChangesAsync();

        await _rewardService.AwardActivityRewardsAsync(
            userId,
            "exam_attempt",
            attempt.AttemptId,
            attempt.Exam?.ExamMode ?? "test",
            CalculateScoreOnTen(correctCount, questions.Count));

        return new SubmitPracticeResponse
        {
            AttemptId = attempt.AttemptId,
            Status = attempt.Status,
            Score = totalScore,
            TotalQuestions = questions.Count,
            CorrectCount = correctCount,
            SubmittedAt = attempt.SubmittedAt
        };
    }

    public async Task<AttemptResultResponse> GetResultAsync(int userId, int attemptId)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetResultByIdAsync(attemptId);

        if (attempt is null || attempt.UserId != userId)
        {
            throw new KeyNotFoundException("Attempt not found.");
        }

        return _mapper.Map<AttemptResultResponse>(attempt);
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

    private async Task<Exam> GetPublishedExamAsync(int examId, string expectedSkillType)
    {
        var exam = await _unitOfWork.Exams.GetDetailByIdAsync(examId);

        if (exam is null)
        {
            throw new KeyNotFoundException("Exam not found.");
        }

        if (exam.SkillType != expectedSkillType)
        {
            throw new InvalidOperationException($"Exam is not a {expectedSkillType} practice exam.");
        }

        return exam;
    }

    private static bool IsAnswerCorrect(ExamQuestion question, string userAnswer)
    {
        var normalizedAnswer = NormalizeAnswer(userAnswer);
        var correctAnswer = NormalizeAnswer(question.CorrectAnswer);

        if (!string.IsNullOrWhiteSpace(correctAnswer) && normalizedAnswer == correctAnswer)
        {
            return true;
        }

        return question.Options.Any(option =>
            option.IsCorrect &&
            (NormalizeAnswer(option.Label) == normalizedAnswer || NormalizeAnswer(option.Content) == normalizedAnswer));
    }

    private static bool IsFreeUser(User user)
    {
        return user.SubscriptionPlanId == 1 || user.SubscriptionPlan.Name == "free";
    }

    private static string NormalizeAnswer(string answer)
    {
        return answer.Trim().ToLowerInvariant();
    }

    private static decimal? CalculateScoreOnTen(int correctCount, int totalQuestions)
    {
        return totalQuestions > 0
            ? decimal.Round((decimal)correctCount * 10 / totalQuestions, 2)
            : null;
    }

    private static ExamDetailResponse HideAnswers(ExamDetailResponse response)
    {
        foreach (var section in response.Sections)
        {
            foreach (var question in section.Questions)
            {
                question.CorrectAnswer = string.Empty;
                question.Explanation = null;

                foreach (var option in question.Options)
                {
                    option.IsCorrect = false;
                }
            }
        }

        return response;
    }
}
