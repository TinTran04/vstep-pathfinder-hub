using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IWritingSubmissionRepository
{
    Task<WritingSubmission?> GetByIdAsync(int submissionId);

    Task<bool> HasSubmittedAsync(int userId, int examId);

    Task<WritingSubmission?> GetByAttemptIdAsync(int attemptId);

    Task<WritingSubmission?> GetLatestByExamAsync(int userId, int examId);

    Task AddAsync(WritingSubmission submission);

    void Update(WritingSubmission submission);
}
