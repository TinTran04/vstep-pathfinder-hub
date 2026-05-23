using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Exam;

public class UpdateOptionRequest
{
    public int? OptionId { get; set; }

    [Required]
    [MaxLength(10)]
    public string Label { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    [Range(0, int.MaxValue)]
    public int DisplayOrder { get; set; }
}
