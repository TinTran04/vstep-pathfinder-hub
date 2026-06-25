using DataAccessLayer.Context;
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

    public async Task<(List<ExamAttempt> Items, int TotalCount)> GetHistoryPagedAsync(int userId, int page, int pageSize, string? status = null, string? mode = null)
    {
        var query = _context.ExamAttempts
            .Include(a => a.Exam)
            .Where(a => a.UserId == userId && !a.IsDeleted);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(a => a.Status == status);
        }

        // We can't query JSON dynamically in EF Core perfectly for mode without raw SQL, 
        // so we fetch the data and filter in memory if mode is requested, 
        // OR we can just fetch and filter. Since mode is requested rarely, let's filter after if needed.
        // Wait, "mode" is stored in DraftStateJson._meta.mode OR we can just return all and let FE filter, 
        // but the spec says "Có thể hỗ trợ filter optional mode". I will filter it in memory if mode is provided.
        // Actually, let's just implement basic pagination first.
        
        if (!string.IsNullOrEmpty(mode))
        {
            // Simple string matching for JSON mode property
            query = query.Where(a => a.DraftStateJson != null && a.DraftStateJson.Contains($"\"mode\":\"{mode}\""));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.UpdatedAt ?? a.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }
}
