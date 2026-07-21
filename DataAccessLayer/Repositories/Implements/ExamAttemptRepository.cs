using DataAccessLayer.Context;
using DataAccessLayer.Core.Projections;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class ExamAttemptRepository : IExamAttemptRepository
{
    private readonly ApplicationDbContext _context;

    public ExamAttemptRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<ExamAttempt?> GetByIdAsync(int attemptId)
    {
        return _context.ExamAttempts
            .Include(attempt => attempt.User)
            .Include(attempt => attempt.Exam)
            .FirstOrDefaultAsync(attempt => attempt.AttemptId == attemptId && !attempt.IsDeleted);
    }

    public Task<ExamAttempt?> GetTrackedForUpdateAsync(int attemptId, int userId)
    {
        return _context.ExamAttempts.FirstOrDefaultAsync(attempt =>
            attempt.AttemptId == attemptId &&
            attempt.UserId == userId &&
            !attempt.IsDeleted);
    }

    public Task<ExamAttemptProgressProjection?> GetProgressAsync(int attemptId, int userId)
    {
        return _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt =>
                attempt.AttemptId == attemptId &&
                attempt.UserId == userId &&
                !attempt.IsDeleted)
            .Select(attempt => new ExamAttemptProgressProjection
            {
                AttemptId = attempt.AttemptId,
                Status = attempt.Status,
                ExpiresAt = attempt.ExpiresAt
            })
            .FirstOrDefaultAsync();
    }

    public Task<ExamAttempt?> GetResultByIdAsync(int attemptId)
    {
        return _context.ExamAttempts
            .AsNoTracking()
            .Include(attempt => attempt.Answers)
            .FirstOrDefaultAsync(attempt => attempt.AttemptId == attemptId && !attempt.IsDeleted);
    }

    public Task<ExamAttempt?> GetInProgressAttemptAsync(int userId)
    {
        return _context.ExamAttempts
            .Include(attempt => attempt.Exam)
            .Where(attempt => attempt.UserId == userId && attempt.Status == "in_progress" && !attempt.IsDeleted)
            .OrderByDescending(attempt => attempt.UpdatedAt ?? attempt.StartedAt)
            .FirstOrDefaultAsync();
    }

    public Task<bool> HasSubmittedAttemptAsync(int userId, int examId)
    {
        return _context.ExamAttempts
            .AsNoTracking()
            .AnyAsync(attempt =>
                attempt.UserId == userId &&
                attempt.ExamId == examId &&
                !attempt.IsDeleted &&
                (attempt.Status == "submitted" || attempt.Status == "scored"));
    }

    public Task AddAsync(ExamAttempt attempt)
    {
        return _context.ExamAttempts.AddAsync(attempt).AsTask();
    }

    public Task AddAnswerAsync(ExamAttemptAnswer answer)
    {
        return _context.ExamAttemptAnswers.AddAsync(answer).AsTask();
    }

    public void Update(ExamAttempt attempt)
    {
        _context.ExamAttempts.Update(attempt);
    }

    public async Task<(List<ExamAttemptHistoryProjection> Items, int TotalCount)> GetHistoryPagedAsync(
        int userId,
        int page,
        int pageSize,
        string? status = null,
        string? mode = null)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 10 : pageSize;

        var query = _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt => attempt.UserId == userId && !attempt.IsDeleted);

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(attempt => attempt.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(mode))
        {
            query = query.Where(attempt =>
                attempt.DraftStateJson != null &&
                attempt.DraftStateJson.Contains($"\"mode\":\"{mode}\""));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(attempt => attempt.UpdatedAt ?? attempt.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(attempt => new ExamAttemptHistoryProjection
            {
                AttemptId = attempt.AttemptId,
                ExamId = attempt.ExamId,
                ExamTitle = attempt.Exam != null ? attempt.Exam.Title : null,
                SkillType = attempt.SkillType,
                Status = attempt.Status,
                StartedAt = attempt.StartedAt,
                SubmittedAt = attempt.SubmittedAt,
                CompletedAt = attempt.CompletedAt,
                UpdatedAt = attempt.UpdatedAt,
                ExpiresAt = attempt.ExpiresAt,
                Score = attempt.Score,
                CurrentSkill = attempt.CurrentSkill,
                DraftStateJson = attempt.DraftStateJson
            })
            .ToListAsync();

        return (items, totalCount);
    }

    public Task<List<CompletedAttemptSelectionProjection>> GetCompletedSelectionsAsync(int userId)
    {
        return _context.ExamAttempts
            .AsNoTracking()
            .Where(attempt =>
                attempt.UserId == userId &&
                !attempt.IsDeleted &&
                (attempt.Status == "submitted" ||
                 attempt.Status == "scored" ||
                 attempt.Status == "completed"))
            .Select(attempt => new CompletedAttemptSelectionProjection
            {
                ExamId = attempt.ExamId,
                DraftStateJson = attempt.DraftStateJson
            })
            .ToListAsync();
    }
}
