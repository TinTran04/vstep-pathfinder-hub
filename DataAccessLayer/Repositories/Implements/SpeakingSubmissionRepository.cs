using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class SpeakingSubmissionRepository : ISpeakingSubmissionRepository
{
    private readonly ApplicationDbContext _context;

    public SpeakingSubmissionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<SpeakingSubmission?> GetByIdAsync(int submissionId)
    {
        return _context.SpeakingSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(submission => submission.SpeakingSubmissionId == submissionId && !submission.IsDeleted);
    }

    public Task<bool> HasSubmittedAsync(int userId, int examId)
    {
        return _context.SpeakingSubmissions
            .AsNoTracking()
            .AnyAsync(submission =>
                submission.UserId == userId &&
                submission.ExamId == examId &&
                !submission.IsDeleted &&
                (submission.Status == "pending" ||
                 submission.Status == "processing" ||
                 submission.Status == "scored"));
    }

    public Task AddAsync(SpeakingSubmission submission)
    {
        return _context.SpeakingSubmissions.AddAsync(submission).AsTask();
    }

    public Task<SpeakingSubmission?> GetByAttemptIdAsync(int attemptId)
    {
        return _context.SpeakingSubmissions
            .AsNoTracking()
            .FirstOrDefaultAsync(submission => submission.AttemptId == attemptId && !submission.IsDeleted);
    }

    public Task<List<SpeakingSubmission>> GetAllByAttemptIdAsync(int attemptId)
    {
        return _context.SpeakingSubmissions
            .AsNoTracking()
            .Where(submission => submission.AttemptId == attemptId && !submission.IsDeleted)
            .OrderBy(submission => submission.PartNumber ?? submission.SpeakingSubmissionId)
            .ToListAsync();
    }

    public Task<SpeakingSubmission?> GetLatestByExamAsync(int userId, int examId)
    {
        return _context.SpeakingSubmissions
            .AsNoTracking()
            .Where(submission => submission.UserId == userId && submission.ExamId == examId && !submission.IsDeleted)
            .OrderByDescending(submission => submission.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public void Update(SpeakingSubmission submission)
    {
        _context.SpeakingSubmissions.Update(submission);
    }
}
