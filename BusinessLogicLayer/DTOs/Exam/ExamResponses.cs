namespace BusinessLogicLayer.DTOs.Exam;

public class ExamResponse
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
}

public class ExamDetailResponse : ExamResponse
{
    public List<SectionResponse> Sections { get; set; } = new();
}

public class SectionResponse
{
    public int SectionId { get; set; }

    public int ExamId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Instruction { get; set; } = string.Empty;

    public string? PassageText { get; set; }

    public string? AudioUrl { get; set; }

    public int DisplayOrder { get; set; }

    public List<QuestionResponse> Questions { get; set; } = new();

    public string? SkillType { get; set; }
}

public class QuestionResponse
{
    public int QuestionId { get; set; }

    public int SectionId { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public string QuestionType { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public string? Explanation { get; set; }

    public decimal Score { get; set; }

    public int DisplayOrder { get; set; }

    public List<OptionResponse> Options { get; set; } = new();
}

public class OptionResponse
{
    public int OptionId { get; set; }

    public int QuestionId { get; set; }

    public string Label { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public int DisplayOrder { get; set; }
}
