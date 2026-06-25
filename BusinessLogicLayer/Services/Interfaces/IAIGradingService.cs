using BusinessLogicLayer.DTOs.AI;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IAIGradingService
{
    Task<AiScoreResult> GradeWritingAsync(int userId, int submissionId, string prompt, string essayText, CancellationToken cancellationToken = default);

    Task<AiScoreResult> GradeSpeakingAsync(int userId, int submissionId, string speakingPrompt, string? transcript = null, string? audioUrl = null, string? audioObjectKey = null, CancellationToken cancellationToken = default);
}
