using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Exam;

public class CreateQuestionRequest
{
    [Required]
    [MaxLength(3000)]
    public string QuestionText { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string QuestionType { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string CorrectAnswer { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Explanation { get; set; }

    [Range(0, 100)]
    public decimal Score { get; set; } = 1;

    [Range(0, int.MaxValue)]
    public int DisplayOrder { get; set; }

    public List<CreateOptionRequest> Options { get; set; } = new();
}
