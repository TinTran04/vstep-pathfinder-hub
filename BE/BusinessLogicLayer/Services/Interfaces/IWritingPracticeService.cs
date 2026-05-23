using BusinessLogicLayer.DTOs.Writing;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IWritingPracticeService
{
    Task<WritingSubmissionResponse> SubmitAsync(int userId, int examId, SubmitWritingRequest request);

    Task<WritingResultResponse> GetSubmissionAsync(int userId, int submissionId);
}
