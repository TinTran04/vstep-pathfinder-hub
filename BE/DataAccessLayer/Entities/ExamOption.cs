namespace DataAccessLayer.Entities;

public class ExamOption
{
    public int OptionId { get; set; }

    public int QuestionId { get; set; }

    public string Label { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public int DisplayOrder { get; set; }

    public ExamQuestion? Question { get; set; }
}
