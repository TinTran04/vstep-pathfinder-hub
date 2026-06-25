using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface ISpeakingSubmissionRepository
{
    Task<SpeakingSubmission?> GetByIdAsync(int submissionId);

    Task<bool> HasSubmittedAsync(int userId, int examId);

    Task<SpeakingSubmission?> GetByAttemptIdAsync(int attemptId);

    Task<List<SpeakingSubmission>> GetAllByAttemptIdAsync(int attemptId);

    Task<SpeakingSubmission?> GetLatestByExamAsync(int userId, int examId);

    Task AddAsync(SpeakingSubmission submission);

    void Update(SpeakingSubmission submission);
}
