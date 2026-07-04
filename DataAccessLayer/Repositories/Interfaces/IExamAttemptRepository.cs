using DataAccessLayer.Entities;
using DataAccessLayer.Core.Projections;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IExamAttemptRepository
{
    Task<ExamAttempt?> GetByIdAsync(int attemptId);

    Task<ExamAttempt?> GetTrackedForUpdateAsync(int attemptId, int userId);

    Task<ExamAttemptProgressProjection?> GetProgressAsync(int attemptId, int userId);

    Task<ExamAttempt?> GetResultByIdAsync(int attemptId);

    Task<ExamAttempt?> GetInProgressAttemptAsync(int userId);

    Task<bool> HasSubmittedAttemptAsync(int userId, int examId);

    Task AddAsync(ExamAttempt attempt);

    Task AddAnswerAsync(ExamAttemptAnswer answer);

    void Update(ExamAttempt attempt);

    Task<(List<ExamAttemptHistoryProjection> Items, int TotalCount)> GetHistoryPagedAsync(int userId, int page, int pageSize, string? status = null, string? mode = null);

    Task<List<CompletedAttemptSelectionProjection>> GetCompletedSelectionsAsync(int userId);
}
