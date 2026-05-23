namespace DataAccessLayer.Entities;

public class ExamQuestion
{
    public int QuestionId { get; set; }

    public int SectionId { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public string QuestionType { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public string? Explanation { get; set; }

    public decimal Score { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public ExamSection? Section { get; set; }

    public ICollection<ExamOption> Options { get; set; } = new List<ExamOption>();
}
