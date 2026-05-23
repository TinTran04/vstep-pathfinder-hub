namespace DataAccessLayer.Entities;

public class ExamSection
{
    public int SectionId { get; set; }

    public int ExamId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Instruction { get; set; } = string.Empty;

    public string? PassageText { get; set; }

    public string? AudioUrl { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public Exam? Exam { get; set; }

    public ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
}
