namespace BusinessLogicLayer.DTOs.AI;

public class AiScoreResult
{
    public decimal Score { get; set; }

    public string? Feedback { get; set; }

    public string? Transcript { get; set; }
}
