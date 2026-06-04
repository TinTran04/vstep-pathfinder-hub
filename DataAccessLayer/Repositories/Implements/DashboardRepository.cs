using DataAccessLayer.Context;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class DashboardRepository : IDashboardRepository
{
    private const string ScoredStatus = "scored";
    private const string SubmittedStatus = "submitted";
    private const string ExamAttemptSource = "exam_attempt";
    private const string WritingSubmissionSource = "writing_submission";
    private const string SpeakingSubmissionSource = "speaking_submission";
    private const string LessonMode = "lesson";
    private const string TestMode = "test";

    private readonly ApplicationDbContext _context;

    public DashboardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> GetRewardPointsAsync(int userId)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(user => user.UserId == userId)
            .Select(user => user.RewardPoints)
            .FirstOrDefaultAsync();
    }

    public async Task<int> GetWeekStudySecondsAsync(int userId, DateTime weekStartUtc, DateTime weekEndUtc)
    {
        weekStartUtc = EnsureUtc(weekStartUtc);
        weekEndUtc = EnsureUtc(weekEndUtc);

        var examSeconds = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt =>
                attempt.UserId == userId &&
                (attempt.Status == ScoredStatus || attempt.Status == SubmittedStatus) &&
                attempt.SubmittedAt >= weekStartUtc &&
                attempt.SubmittedAt < weekEndUtc)
            .Select(attempt => attempt.DurationUsedSeconds ?? 0)
            .SumAsync();

        var writingSeconds = await _context.WritingSubmissions
            .AsNoTracking()
            .Where(submission =>
                submission.UserId == userId &&
                (submission.Status == ScoredStatus || submission.Status == SubmittedStatus) &&
                submission.CreatedAt >= weekStartUtc &&
                submission.CreatedAt < weekEndUtc)
            .Select(submission => submission.DurationUsedSeconds ?? 0)
            .SumAsync();

        var speakingSeconds = await _context.SpeakingSubmissions
            .AsNoTracking()
            .Where(submission =>
                submission.UserId == userId &&
                (submission.Status == ScoredStatus || submission.Status == SubmittedStatus) &&
                submission.CreatedAt >= weekStartUtc &&
                submission.CreatedAt < weekEndUtc)
            .Select(submission => submission.DurationUsedSeconds ?? 0)
            .SumAsync();

        return examSeconds + writingSeconds + speakingSeconds;
    }

    public async Task<CompletedCountsProjection> GetCompletedCountsAsync(int userId)
    {
        var examModes = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt => attempt.UserId == userId && (attempt.Status == ScoredStatus || attempt.Status == SubmittedStatus))
            .Select(attempt => attempt.Exam!.ExamMode)
            .ToListAsync();

        var writingModes = await _context.WritingSubmissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && (submission.Status == ScoredStatus || submission.Status == SubmittedStatus))
            .Select(submission => submission.Exam!.ExamMode)
            .ToListAsync();

        var speakingModes = await _context.SpeakingSubmissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && (submission.Status == ScoredStatus || submission.Status == SubmittedStatus))
            .Select(submission => submission.Exam!.ExamMode)
            .ToListAsync();

        var allModes = examModes.Concat(writingModes).Concat(speakingModes).ToList();

        return new CompletedCountsProjection
        {
            CompletedCount = allModes.Count,
            CompletedLessons = allModes.Count(mode => mode == LessonMode),
            CompletedTests = allModes.Count(mode => mode == TestMode)
        };
    }

    public async Task<List<DateOnly>> GetActivityDatesAsync(int userId, DateTime fromUtc, DateTime toUtc)
    {
        fromUtc = EnsureUtc(fromUtc);
        toUtc = EnsureUtc(toUtc);

        var examDates = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt =>
                attempt.UserId == userId &&
                (attempt.Status == ScoredStatus || attempt.Status == SubmittedStatus) &&
                attempt.SubmittedAt >= fromUtc &&
                attempt.SubmittedAt < toUtc)
            .Select(attempt => attempt.SubmittedAt!.Value)
            .ToListAsync();

        var writingDates = await _context.WritingSubmissions
            .AsNoTracking()
            .Where(submission =>
                submission.UserId == userId &&
                (submission.Status == ScoredStatus || submission.Status == SubmittedStatus) &&
                submission.CreatedAt >= fromUtc &&
                submission.CreatedAt < toUtc)
            .Select(submission => submission.CreatedAt)
            .ToListAsync();

        var speakingDates = await _context.SpeakingSubmissions
            .AsNoTracking()
            .Where(submission =>
                submission.UserId == userId &&
                (submission.Status == ScoredStatus || submission.Status == SubmittedStatus) &&
                submission.CreatedAt >= fromUtc &&
                submission.CreatedAt < toUtc)
            .Select(submission => submission.CreatedAt)
            .ToListAsync();

        return examDates
            .Concat(writingDates)
            .Concat(speakingDates)
            .Select(ToVietnamDate)
            .Distinct()
            .OrderBy(date => date)
            .ToList();
    }

    public async Task<List<RecentResultProjection>> GetRecentResultsAsync(int userId, int limit)
    {
        var examResults = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt =>
                attempt.UserId == userId &&
                (attempt.Status == ScoredStatus || attempt.Status == SubmittedStatus) &&
                attempt.SubmittedAt != null)
            .OrderByDescending(attempt => attempt.SubmittedAt)
            .Take(limit)
            .Select(attempt => new RecentResultProjection
            {
                Id = attempt.AttemptId,
                SourceType = ExamAttemptSource,
                ExamId = attempt.ExamId,
                ExamTitle = attempt.Exam!.Title,
                SkillType = attempt.SkillType,
                ExamMode = attempt.Exam.ExamMode,
                Score = attempt.Score,
                ScoreOnTen = attempt.TotalQuestions > 0 && attempt.CorrectCount != null
                    ? (decimal)attempt.CorrectCount.Value * 10 / attempt.TotalQuestions.Value
                    : attempt.Score,
                Status = attempt.Status,
                DurationUsedSeconds = attempt.DurationUsedSeconds,
                CompletedAt = attempt.SubmittedAt!.Value
            })
            .ToListAsync();

        var writingResults = await _context.WritingSubmissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && (submission.Status == ScoredStatus || submission.Status == SubmittedStatus))
            .OrderByDescending(submission => submission.CreatedAt)
            .Take(limit)
            .Select(submission => new RecentResultProjection
            {
                Id = submission.WritingSubmissionId,
                SourceType = WritingSubmissionSource,
                ExamId = submission.ExamId,
                ExamTitle = submission.Exam!.Title,
                SkillType = "writing",
                ExamMode = submission.Exam.ExamMode,
                Score = submission.Score,
                ScoreOnTen = submission.Score,
                Status = submission.Status,
                DurationUsedSeconds = submission.DurationUsedSeconds,
                CompletedAt = submission.CreatedAt
            })
            .ToListAsync();

        var speakingResults = await _context.SpeakingSubmissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && (submission.Status == ScoredStatus || submission.Status == SubmittedStatus))
            .OrderByDescending(submission => submission.CreatedAt)
            .Take(limit)
            .Select(submission => new RecentResultProjection
            {
                Id = submission.SpeakingSubmissionId,
                SourceType = SpeakingSubmissionSource,
                ExamId = submission.ExamId,
                ExamTitle = submission.Exam!.Title,
                SkillType = "speaking",
                ExamMode = submission.Exam.ExamMode,
                Score = submission.Score,
                ScoreOnTen = submission.Score,
                Status = submission.Status,
                DurationUsedSeconds = submission.DurationUsedSeconds,
                CompletedAt = submission.CreatedAt
            })
            .ToListAsync();

        return examResults
            .Concat(writingResults)
            .Concat(speakingResults)
            .OrderByDescending(result => result.CompletedAt)
            .Take(limit)
            .ToList();
    }

    public async Task<List<SkillProgressProjection>> GetSkillProgressAsync(int userId)
    {
        var examScores = await _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt => attempt.UserId == userId && (attempt.Status == ScoredStatus || attempt.Status == SubmittedStatus))
            .Select(attempt => new
            {
                attempt.SkillType,
                ScoreOnTen = attempt.TotalQuestions > 0 && attempt.CorrectCount != null
                    ? (decimal?)((decimal)attempt.CorrectCount.Value * 10 / attempt.TotalQuestions.Value)
                    : attempt.Score
            })
            .ToListAsync();

        var writingScores = await _context.WritingSubmissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && (submission.Status == ScoredStatus || submission.Status == SubmittedStatus))
            .Select(submission => new
            {
                SkillType = "writing",
                ScoreOnTen = submission.Score
            })
            .ToListAsync();

        var speakingScores = await _context.SpeakingSubmissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && (submission.Status == ScoredStatus || submission.Status == SubmittedStatus))
            .Select(submission => new
            {
                SkillType = "speaking",
                ScoreOnTen = submission.Score
            })
            .ToListAsync();

        return examScores
            .Concat(writingScores)
            .Concat(speakingScores)
            .GroupBy(score => score.SkillType)
            .Select(group =>
            {
                var scoredItems = group
                    .Where(score => score.ScoreOnTen.HasValue)
                    .Select(score => score.ScoreOnTen!.Value)
                    .ToList();

                return new SkillProgressProjection
                {
                    SkillType = group.Key,
                    CompletedCount = group.Count(),
                    AverageScoreOnTen = scoredItems.Count == 0
                        ? null
                        : decimal.Round(scoredItems.Average(), 2)
                };
            })
            .ToList();
    }

    private static DateOnly ToVietnamDate(DateTime utcDateTime)
    {
        return DateOnly.FromDateTime(utcDateTime.AddHours(7));
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
