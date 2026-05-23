using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Exam;

public class CreateExamRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string SkillType { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Range(1, 300)]
    public int DurationMinutes { get; set; }

    [MaxLength(1000)]
    public string? AudioUrl { get; set; }

    [MaxLength(1000)]
    public string? ImageUrl { get; set; }

    public bool IsPublished { get; set; }
}
