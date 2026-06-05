namespace BusinessLogicLayer.Services.Interfaces;

public interface IR2StorageService
{
    Task<(string UploadUrl, string ObjectKey, string ContentType, DateTime ExpiresAt)> CreateSpeakingUploadUrlAsync(int userId, int examId, string contentType);

    Task<(string UploadUrl, string ObjectKey, string ContentType, DateTime ExpiresAt)> CreateListeningAudioUploadUrlAsync(int? examId, string contentType, string? fileExtension);

    string GetObjectUrl(string objectKey);
}
