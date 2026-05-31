using BusinessLogicLayer.DTOs.Exam;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IListeningExamImportService
{
    Task<ImportListeningExamResponse> ImportAsync(Stream docxStream, string fileName, string? audioUrl, bool isPublished);
}
