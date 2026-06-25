namespace BusinessLogicLayer.DTOs.AI;

public class AiScoreResult
{
    public decimal Score { get; set; }

    public string? Feedback { get; set; }

    public string? Transcript { get; set; }

    public string? FeedbackJson { get; set; }

    // ── Writing: new primary fields ──
    public decimal? TaskFulfillment { get; set; }
    public decimal? Grammar { get; set; }
    public decimal? Vocabulary { get; set; }
    public decimal? Organization { get; set; }

    // ── Writing: legacy aliases (backward compat) ──
    public decimal? TaskResponse { get; set; }
    public decimal? TaskAchievement { get; set; }

    // ── Speaking: new primary fields ──
    public decimal? FluencyIdeaDevelopment { get; set; }
    public decimal? Pronunciation { get; set; }
    public decimal? ContentCoherence { get; set; }

    // ── Speaking: legacy aliases (backward compat) ──
    public decimal? Fluency { get; set; }
    public decimal? TopicDevelopment { get; set; }
    public decimal? Relevance { get; set; }

    public List<string> FeedbackPoints { get; set; } = new();
}
