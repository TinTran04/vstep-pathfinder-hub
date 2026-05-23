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

    public void Update(SpeakingSubmission submission)
    {
        _context.SpeakingSubmissions.Update(submission);
    }
}
