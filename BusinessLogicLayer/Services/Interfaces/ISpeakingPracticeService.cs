using BusinessLogicLayer.DTOs.Speaking;

namespace BusinessLogicLayer.Services.Interfaces;

public interface ISpeakingPracticeService
{
    Task<SpeakingUploadUrlResponse> CreateUploadUrlAsync(int userId, CreateSpeakingUploadUrlRequest request);

    Task<SpeakingSubmissionResponse> SubmitAsync(int userId, int examId, SubmitSpeakingRequest request);

    Task<SpeakingResultResponse> GetSubmissionAsync(int userId, int submissionId);

    Task<(string ObjectKey, string ObjectUrl)> UploadAudioAsync(int userId, int examId, Stream fileStream, string contentType);
}
