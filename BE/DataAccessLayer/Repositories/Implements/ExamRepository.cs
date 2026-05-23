using DataAccessLayer.Context;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class ExamRepository : IExamRepository
{
    private readonly ApplicationDbContext _context;

    public ExamRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(List<Exam> Exams, int TotalCount)> GetPagedAsync(ExamQueryParameters query)
    {
        var examsQuery = _context.Exams.AsNoTracking().Where(exam => !exam.IsDeleted);

        if (!string.IsNullOrWhiteSpace(query.SkillType))
        {
            examsQuery = examsQuery.Where(exam => exam.SkillType == query.SkillType);
        }

        if (query.IsPublished.HasValue)
        {
            examsQuery = examsQuery.Where(exam => exam.IsPublished == query.IsPublished.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            examsQuery = examsQuery.Where(exam =>
                exam.Title.ToLower().Contains(search) ||
                exam.Description.ToLower().Contains(search));
        }

        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 100 ? 10 : query.PageSize;
        var totalCount = await examsQuery.CountAsync();
        var exams = await examsQuery
            .OrderByDescending(exam => exam.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(exam => new Exam
            {
                ExamId = exam.ExamId,
                Title = exam.Title,
                SkillType = exam.SkillType,
                Description = exam.Description,
                DurationMinutes = exam.DurationMinutes,
                AudioUrl = exam.AudioUrl,
                ImageUrl = exam.ImageUrl,
                IsPublished = exam.IsPublished,
                CreatedAt = exam.CreatedAt,
                UpdatedAt = exam.UpdatedAt,
                IsDeleted = exam.IsDeleted
            })
            .ToListAsync();

        return (exams, totalCount);
    }

    public Task<Exam?> GetByIdAsync(int examId, bool includeDeleted = false)
    {
        var query = _context.Exams.AsQueryable();

        if (!includeDeleted)
        {
            query = query.Where(exam => !exam.IsDeleted);
        }

        return query.FirstOrDefaultAsync(exam => exam.ExamId == examId);
    }

    public Task<Exam?> GetDetailByIdAsync(int examId, bool includeUnpublished = false)
    {
        var query = _context.Exams
            .AsNoTracking()
            .Where(exam => !exam.IsDeleted);

        if (!includeUnpublished)
        {
            query = query.Where(exam => exam.IsPublished);
        }

        return query
            .Include(exam => exam.Sections.Where(section => !section.IsDeleted))
                .ThenInclude(section => section.Questions.Where(question => !question.IsDeleted))
                    .ThenInclude(question => question.Options)
            .FirstOrDefaultAsync(exam => exam.ExamId == examId);
    }

    public Task<ExamSection?> GetSectionByIdAsync(int sectionId)
    {
        return _context.ExamSections
            .FirstOrDefaultAsync(section => section.SectionId == sectionId && !section.IsDeleted);
    }

    public Task<ExamQuestion?> GetQuestionByIdAsync(int questionId)
    {
        return _context.ExamQuestions
            .Include(question => question.Options)
            .FirstOrDefaultAsync(question => question.QuestionId == questionId && !question.IsDeleted);
    }

    public Task<List<ExamQuestion>> GetQuestionsForScoringAsync(int examId)
    {
        return _context.ExamQuestions
            .AsNoTracking()
            .Where(question =>
                !question.IsDeleted &&
                question.Section != null &&
                !question.Section.IsDeleted &&
                question.Section.ExamId == examId)
            .Include(question => question.Options)
            .OrderBy(question => question.DisplayOrder)
            .ToListAsync();
    }

    public Task AddAsync(Exam exam)
    {
        return _context.Exams.AddAsync(exam).AsTask();
    }

    public Task AddSectionAsync(ExamSection section)
    {
        return _context.ExamSections.AddAsync(section).AsTask();
    }

    public Task AddQuestionAsync(ExamQuestion question)
    {
        return _context.ExamQuestions.AddAsync(question).AsTask();
    }

    public void Update(Exam exam)
    {
        _context.Exams.Update(exam);
    }

    public void UpdateSection(ExamSection section)
    {
        _context.ExamSections.Update(section);
    }

    public void UpdateQuestion(ExamQuestion question)
    {
        _context.ExamQuestions.Update(question);
    }

    public void SoftDelete(Exam exam)
    {
        exam.IsDeleted = true;
        _context.Exams.Update(exam);
    }

    public void SoftDeleteSection(ExamSection section)
    {
        section.IsDeleted = true;
        _context.ExamSections.Update(section);
    }

    public void SoftDeleteQuestion(ExamQuestion question)
    {
        question.IsDeleted = true;
        _context.ExamQuestions.Update(question);
    }
}
