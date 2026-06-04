using BusinessLogicLayer.DTOs.AI;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IOpenRouterGradingService
{
    Task<AiScoreResult> GradeWritingAsync(string prompt, string essayText);

    Task<AiScoreResult> GradeSpeakingAsync(string speakingPrompt, string audioUrl, string audioObjectKey);
}
