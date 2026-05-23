using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IExamService
{
    Task<PagedResponse<ExamResponse>> GetExamsAsync(ExamQueryRequest request, bool includeUnpublished);

    Task<ExamDetailResponse> GetExamByIdAsync(int examId, bool includeUnpublished);

    Task<ExamResponse> CreateExamAsync(CreateExamRequest request);

    Task<ExamResponse> UpdateExamAsync(int examId, UpdateExamRequest request);

    Task DeleteExamAsync(int examId);

    Task<SectionResponse> CreateSectionAsync(int examId, CreateSectionRequest request);

    Task<SectionResponse> UpdateSectionAsync(int sectionId, UpdateSectionRequest request);

    Task DeleteSectionAsync(int sectionId);

    Task<QuestionResponse> CreateQuestionAsync(int sectionId, CreateQuestionRequest request);

    Task<QuestionResponse> UpdateQuestionAsync(int questionId, UpdateQuestionRequest request);

    Task DeleteQuestionAsync(int questionId);
}
