using BusinessLogicLayer.DTOs.Exam;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IListeningAudioService
{
    Task<ListeningAudioUploadUrlResponse> CreateUploadUrlAsync(CreateListeningAudioUploadUrlRequest request);
}
