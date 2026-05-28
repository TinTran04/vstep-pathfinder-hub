namespace BusinessLogicLayer.DTOs.Exam;

public class ImportListeningExamResponse
{
    public int ExamId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? AudioUrl { get; set; }

    public int TotalSections { get; set; }

    public int TotalQuestions { get; set; }

    public List<ImportReadingWarningResponse> Warnings { get; set; } = new();
}
