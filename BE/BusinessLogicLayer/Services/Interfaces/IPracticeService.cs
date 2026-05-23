using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IPracticeService
{
    Task<StartPracticeResponse> StartPracticeAsync(int userId, int examId, string expectedSkillType);

    Task<SubmitPracticeResponse> SubmitPracticeAsync(int userId, int attemptId, string expectedSkillType, IReadOnlyList<SubmitAnswerRequest> answers, int durationUsedSeconds);

    Task<AttemptResultResponse> GetResultAsync(int userId, int attemptId);
}
