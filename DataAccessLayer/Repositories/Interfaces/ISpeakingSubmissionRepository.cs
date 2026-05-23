using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface ISpeakingSubmissionRepository
{
    Task<SpeakingSubmission?> GetByIdAsync(int submissionId);

    Task<bool> HasSubmittedAsync(int userId, int examId);

    Task AddAsync(SpeakingSubmission submission);

    void Update(SpeakingSubmission submission);
}
