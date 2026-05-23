namespace BusinessLogicLayer.DTOs.Exam;

public class ImportReadingExamResponse
{
    public int ExamId { get; set; }

    public string Title { get; set; } = string.Empty;

    public int TotalSections { get; set; }

    public int TotalQuestions { get; set; }

    public List<ImportReadingWarningResponse> Warnings { get; set; } = new();
}

public class ImportReadingWarningResponse
{
    public string Code { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public int? QuestionNumber { get; set; }

    public int? SectionNumber { get; set; }
}
