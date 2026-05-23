using BusinessLogicLayer.DTOs.Exam;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IReadingExamImportService
{
    Task<ImportReadingExamResponse> ImportAsync(Stream docxStream, string fileName, bool isPublished);
}
