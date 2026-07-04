using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IPracticeService
{
    Task<StartPracticeResponse> StartPracticeAsync(int userId, int examId, string expectedSkillType);

    Task<SubmitPracticeResponse> SubmitPracticeAsync(int userId, int attemptId, string expectedSkillType, IReadOnlyList<SubmitAnswerRequest> answers, int durationUsedSeconds);

    Task<AttemptResultResponse> GetResultAsync(int userId, int attemptId);

    Task<AttemptReviewResponse> GetAttemptReviewAsync(int userId, int attemptId, bool isPrivileged = false);

    Task<InProgressAttemptResponse?> GetInProgressAttemptAsync(int userId);

    Task<AttemptProgressResponse> GetAttemptProgressAsync(int userId, int attemptId);

    Task AutosaveAttemptAsync(int userId, int attemptId, AutosaveRequest request);

    Task<SubmitPracticeResponse> SubmitMockTestAsync(int userId, int attemptId, SubmitMockTestRequest request);

    Task<StartRandomMockTestResponse> StartRandomMockTestAsync(int userId);

    Task<HistoryPagedResponse> GetHistoryAsync(int userId, int page, int pageSize, string? status = null, string? mode = null);

    Task DeleteAttemptAsync(int userId, int attemptId);
}
