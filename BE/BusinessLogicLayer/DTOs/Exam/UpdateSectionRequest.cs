using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Exam;

public class UpdateSectionRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Instruction { get; set; } = string.Empty;

    public string? PassageText { get; set; }

    [MaxLength(1000)]
    public string? AudioUrl { get; set; }

    [Range(0, int.MaxValue)]
    public int DisplayOrder { get; set; }
}
