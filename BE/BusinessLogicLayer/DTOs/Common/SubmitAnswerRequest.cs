using System.ComponentModel.DataAnnotations;

namespace BusinessLogicLayer.DTOs.Common;

public class SubmitAnswerRequest
{
    [Required]
    public int QuestionId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string UserAnswer { get; set; } = string.Empty;
}
