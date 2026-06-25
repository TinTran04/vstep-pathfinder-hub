namespace BusinessLogicLayer.Services.Interfaces;

public interface IR2StorageService
{
    Task<(string UploadUrl, string ObjectKey, string ContentType, DateTime ExpiresAt)> CreateSpeakingUploadUrlAsync(int userId, int examId, string contentType);

    Task<(string UploadUrl, string ObjectKey, string ContentType, DateTime ExpiresAt)> CreateListeningAudioUploadUrlAsync(int? examId, string contentType, string? fileExtension);

    Task<string> CreateReadUrlAsync(string objectKey);

    string GetObjectUrl(string objectKey);

    Task<(string ObjectKey, string ObjectUrl)> UploadSpeakingAudioAsync(int userId, int examId, Stream fileStream, string contentType);
}
