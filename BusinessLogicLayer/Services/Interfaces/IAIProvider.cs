using BusinessLogicLayer.DTOs.AI;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IAIProvider
{
    string ProviderName { get; }
    Task<AiProviderResponse> SendChatRequestAsync(AiChatRequest request, CancellationToken cancellationToken = default);
}
