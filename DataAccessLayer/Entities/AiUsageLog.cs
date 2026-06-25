using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccessLayer.Entities;

[Table("AiUsageLogs")]
public class AiUsageLog
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? SubmissionId { get; set; }

    [MaxLength(20)]
    public string SkillType { get; set; } = string.Empty; // "writing", "speaking"

    [MaxLength(50)]
    public string ActionType { get; set; } = string.Empty; // "writing_grading", "speaking_grading"

    [MaxLength(50)]
    public string PrimaryProvider { get; set; } = string.Empty;

    [MaxLength(50)]
    public string ProviderUsed { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ModelUsed { get; set; } = string.Empty;

    public bool FallbackUsed { get; set; }

    public int InputTokens { get; set; }

    public int OutputTokens { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = string.Empty; // "success", "failed", "fallback_success", "fallback_failed"

    public string? ErrorMessage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
