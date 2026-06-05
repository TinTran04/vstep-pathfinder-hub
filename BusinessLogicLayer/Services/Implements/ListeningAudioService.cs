using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.Services.Interfaces;

namespace BusinessLogicLayer.Services.Implements;

public class ListeningAudioService : IListeningAudioService
{
    private readonly IR2StorageService _r2StorageService;

    public ListeningAudioService(IR2StorageService r2StorageService)
    {
        _r2StorageService = r2StorageService;
    }

    public async Task<ListeningAudioUploadUrlResponse> CreateUploadUrlAsync(CreateListeningAudioUploadUrlRequest request)
    {
        var (uploadUrl, objectKey, contentType, expiresAt) = await _r2StorageService.CreateListeningAudioUploadUrlAsync(
            request.ExamId,
            request.ContentType,
            request.FileExtension);

        return new ListeningAudioUploadUrlResponse
        {
            UploadUrl = uploadUrl,
            AudioObjectKey = objectKey,
            ContentType = contentType,
            AudioUrl = _r2StorageService.GetObjectUrl(objectKey),
            ExpiresAt = expiresAt
        };
    }
}
