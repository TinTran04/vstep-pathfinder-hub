using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class WritingSubmissionRepository : IWritingSubmissionRepository
{
    private readonly ApplicationDbContext _context;

    public WritingSubmissionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<WritingSubmission?> GetByIdAsync(int submissionId)
    {
        return _context.WritingSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(submission => submission.WritingSubmissionId == submissionId && !submission.IsDeleted);
    }

    public Task<bool> HasSubmittedAsync(int userId, int examId)
    {
        return _context.WritingSubmissions
            .AsNoTracking()
            .AnyAsync(submission =>
                submission.UserId == userId &&
                submission.ExamId == examId &&
                !submission.IsDeleted &&
                (submission.Status == "pending" ||
                 submission.Status == "processing" ||
                 submission.Status == "scored"));
    }

    public Task AddAsync(WritingSubmission submission)
    {
        return _context.WritingSubmissions.AddAsync(submission).AsTask();
    }

    public Task<WritingSubmission?> GetByAttemptIdAsync(int attemptId)
    {
        return _context.WritingSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(submission => submission.AttemptId == attemptId && !submission.IsDeleted);
    }

    public Task<WritingSubmission?> GetLatestByExamAsync(int userId, int examId)
    {
        return _context.WritingSubmissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && submission.ExamId == examId && !submission.IsDeleted)
            .OrderByDescending(submission => submission.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public void Update(WritingSubmission submission)
    {
        _context.WritingSubmissions.Update(submission);
    }
}
