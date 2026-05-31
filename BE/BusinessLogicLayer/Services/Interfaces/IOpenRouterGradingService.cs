using BusinessLogicLayer.DTOs.AI;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IOpenRouterGradingService
{
    Task<AiScoreResult> GradeWritingAsync(string prompt, string essayText);

    Task<AiScoreResult> GradeSpeakingAsync(string audioUrl, string audioObjectKey);
}
