namespace BusinessLogicLayer.Services.Interfaces;

public interface IR2StorageService
{
    Task<(string UploadUrl, string ObjectKey, DateTime ExpiresAt)> CreateSpeakingUploadUrlAsync(int userId, int examId, string contentType);

    Task<(string UploadUrl, string ObjectKey, DateTime ExpiresAt)> CreateListeningAudioUploadUrlAsync(int? examId, string contentType, string? fileExtension);

    string GetObjectUrl(string objectKey);
}
