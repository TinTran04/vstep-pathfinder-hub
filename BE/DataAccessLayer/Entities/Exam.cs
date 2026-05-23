namespace DataAccessLayer.Entities;

public class Exam
{
    public int ExamId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string SkillType { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int DurationMinutes { get; set; }

    public string? AudioUrl { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsPublished { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<ExamSection> Sections { get; set; } = new List<ExamSection>();

    public ICollection<ExamAttempt> Attempts { get; set; } = new List<ExamAttempt>();
}
