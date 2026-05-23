using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IExamAttemptRepository
{
    Task<ExamAttempt?> GetByIdAsync(int attemptId);

    Task<ExamAttempt?> GetResultByIdAsync(int attemptId);

    Task<bool> HasSubmittedAttemptAsync(int userId, int examId);

    Task AddAsync(ExamAttempt attempt);

    Task AddAnswerAsync(ExamAttemptAnswer answer);

    void Update(ExamAttempt attempt);
}
