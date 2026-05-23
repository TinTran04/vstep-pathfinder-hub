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
}
