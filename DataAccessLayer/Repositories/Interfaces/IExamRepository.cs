using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IExamRepository
{
    Task<(List<Exam> Exams, int TotalCount)> GetPagedAsync(ExamQueryParameters query);

    Task<Exam?> GetByIdAsync(int examId, bool includeDeleted = false);

    Task<Exam?> GetTrackedByIdAsync(int examId, bool includeDeleted = false);

    Task<Exam?> GetDetailByIdAsync(int examId, bool includeUnpublished = false);

    Task<ExamSection?> GetSectionByIdAsync(int sectionId);

    Task<ExamSection?> GetTrackedSectionByIdAsync(int sectionId);

    Task<ExamQuestion?> GetQuestionByIdAsync(int questionId);

    Task<ExamQuestion?> GetTrackedQuestionByIdAsync(int questionId);

    Task<List<ExamQuestion>> GetQuestionsForScoringAsync(int examId);

    Task<List<Exam>> GetPublishedGroupMembersAsync(string groupName);

    Task<int?> GetRandomPublishedPracticeExamIdAsync(string skillType, IReadOnlyCollection<int> excludedExamIds);

    Task AddAsync(Exam exam);

    Task AddSectionAsync(ExamSection section);

    Task AddQuestionAsync(ExamQuestion question);

    void Update(Exam exam);

    void UpdateSection(ExamSection section);

    void UpdateQuestion(ExamQuestion question);

    void SoftDelete(Exam exam);

    void SoftDeleteSection(ExamSection section);

    void SoftDeleteQuestion(ExamQuestion question);
}
