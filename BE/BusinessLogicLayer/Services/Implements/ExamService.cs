using AutoMapper;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class ExamService : IExamService
{
    private static readonly HashSet<string> ValidSkillTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "reading",
        "listening",
        "writing",
        "speaking"
    };

    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ExamService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResponse<ExamResponse>> GetExamsAsync(ExamQueryRequest request, bool includeUnpublished)
    {
        var skillType = NormalizeOptional(request.SkillType);
        ValidateOptionalSkillType(skillType);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 10 : request.PageSize;
        var query = new ExamQueryParameters
        {
            Page = page,
            PageSize = pageSize,
            SkillType = skillType,
            Search = request.Search?.Trim(),
            IsPublished = includeUnpublished ? request.IsPublished : true
        };

        var (exams, totalCount) = await _unitOfWork.Exams.GetPagedAsync(query);

        return new PagedResponse<ExamResponse>
        {
            Items = _mapper.Map<List<ExamResponse>>(exams),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<ExamDetailResponse> GetExamByIdAsync(int examId, bool includeUnpublished)
    {
        var exam = await _unitOfWork.Exams.GetDetailByIdAsync(examId, includeUnpublished);

        if (exam is null)
        {
            throw new KeyNotFoundException("Exam not found.");
        }

        var response = _mapper.Map<ExamDetailResponse>(exam);
        response.Sections = response.Sections.OrderBy(section => section.DisplayOrder).ToList();
        foreach (var section in response.Sections)
        {
            section.Questions = section.Questions.OrderBy(question => question.DisplayOrder).ToList();
            foreach (var question in section.Questions)
            {
                question.Options = question.Options.OrderBy(option => option.DisplayOrder).ToList();
            }
        }

        return includeUnpublished ? response : HideAnswers(response);
    }

    public async Task<ExamResponse> CreateExamAsync(CreateExamRequest request)
    {
        var skillType = NormalizeRequired(request.SkillType);
        ValidateSkillType(skillType);

        var exam = new Exam
        {
            Title = request.Title.Trim(),
            SkillType = skillType,
            Description = request.Description.Trim(),
            DurationMinutes = request.DurationMinutes,
            AudioUrl = NormalizeNullable(request.AudioUrl),
            ImageUrl = NormalizeNullable(request.ImageUrl),
            IsPublished = request.IsPublished
        };

        await _unitOfWork.Exams.AddAsync(exam);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ExamResponse>(exam);
    }

    public async Task<ExamResponse> UpdateExamAsync(int examId, UpdateExamRequest request)
    {
        var exam = await GetExistingExamAsync(examId);
        var skillType = NormalizeRequired(request.SkillType);
        ValidateSkillType(skillType);

        exam.Title = request.Title.Trim();
        exam.SkillType = skillType;
        exam.Description = request.Description.Trim();
        exam.DurationMinutes = request.DurationMinutes;
        exam.AudioUrl = NormalizeNullable(request.AudioUrl);
        exam.ImageUrl = NormalizeNullable(request.ImageUrl);
        exam.IsPublished = request.IsPublished;

        _unitOfWork.Exams.Update(exam);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ExamResponse>(exam);
    }

    public async Task DeleteExamAsync(int examId)
    {
        var exam = await GetExistingExamAsync(examId);

        _unitOfWork.Exams.SoftDelete(exam);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<SectionResponse> CreateSectionAsync(int examId, CreateSectionRequest request)
    {
        _ = await GetExistingExamAsync(examId);

        var section = new ExamSection
        {
            ExamId = examId,
            Title = request.Title.Trim(),
            Instruction = request.Instruction.Trim(),
            PassageText = NormalizeNullable(request.PassageText),
            AudioUrl = NormalizeNullable(request.AudioUrl),
            DisplayOrder = request.DisplayOrder
        };

        await _unitOfWork.Exams.AddSectionAsync(section);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<SectionResponse>(section);
    }

    public async Task<SectionResponse> UpdateSectionAsync(int sectionId, UpdateSectionRequest request)
    {
        var section = await GetExistingSectionAsync(sectionId);

        section.Title = request.Title.Trim();
        section.Instruction = request.Instruction.Trim();
        section.PassageText = NormalizeNullable(request.PassageText);
        section.AudioUrl = NormalizeNullable(request.AudioUrl);
        section.DisplayOrder = request.DisplayOrder;

        _unitOfWork.Exams.UpdateSection(section);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<SectionResponse>(section);
    }

    public async Task DeleteSectionAsync(int sectionId)
    {
        var section = await GetExistingSectionAsync(sectionId);

        _unitOfWork.Exams.SoftDeleteSection(section);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<QuestionResponse> CreateQuestionAsync(int sectionId, CreateQuestionRequest request)
    {
        _ = await GetExistingSectionAsync(sectionId);

        var question = new ExamQuestion
        {
            SectionId = sectionId,
            QuestionText = request.QuestionText.Trim(),
            QuestionType = NormalizeRequired(request.QuestionType),
            CorrectAnswer = NormalizeNullable(request.CorrectAnswer) ?? string.Empty,
            Explanation = NormalizeNullable(request.Explanation),
            Score = request.Score,
            DisplayOrder = request.DisplayOrder,
            Options = request.Options.Select(option => new ExamOption
            {
                Label = option.Label.Trim().ToUpperInvariant(),
                Content = option.Content.Trim(),
                IsCorrect = option.IsCorrect,
                DisplayOrder = option.DisplayOrder
            }).ToList()
        };

        await _unitOfWork.Exams.AddQuestionAsync(question);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<QuestionResponse>(question);
    }

    public async Task<QuestionResponse> UpdateQuestionAsync(int questionId, UpdateQuestionRequest request)
    {
        var question = await GetExistingQuestionAsync(questionId);

        question.QuestionText = request.QuestionText.Trim();
        question.QuestionType = NormalizeRequired(request.QuestionType);
        question.CorrectAnswer = NormalizeNullable(request.CorrectAnswer) ?? string.Empty;
        question.Explanation = NormalizeNullable(request.Explanation);
        question.Score = request.Score;
        question.DisplayOrder = request.DisplayOrder;

        var requestedOptionIds = request.Options
            .Where(option => option.OptionId.HasValue)
            .Select(option => option.OptionId!.Value)
            .ToHashSet();

        var optionsToRemove = question.Options
            .Where(option => !requestedOptionIds.Contains(option.OptionId))
            .ToList();

        foreach (var option in optionsToRemove)
        {
            question.Options.Remove(option);
        }

        foreach (var optionRequest in request.Options)
        {
            var existingOption = optionRequest.OptionId.HasValue
                ? question.Options.FirstOrDefault(option => option.OptionId == optionRequest.OptionId.Value)
                : null;

            if (existingOption is null)
            {
                question.Options.Add(new ExamOption
                {
                    QuestionId = question.QuestionId,
                    Label = optionRequest.Label.Trim().ToUpperInvariant(),
                    Content = optionRequest.Content.Trim(),
                    IsCorrect = optionRequest.IsCorrect,
                    DisplayOrder = optionRequest.DisplayOrder
                });
                continue;
            }

            existingOption.Label = optionRequest.Label.Trim().ToUpperInvariant();
            existingOption.Content = optionRequest.Content.Trim();
            existingOption.IsCorrect = optionRequest.IsCorrect;
            existingOption.DisplayOrder = optionRequest.DisplayOrder;
        }

        _unitOfWork.Exams.UpdateQuestion(question);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<QuestionResponse>(question);
    }

    public async Task DeleteQuestionAsync(int questionId)
    {
        var question = await GetExistingQuestionAsync(questionId);

        _unitOfWork.Exams.SoftDeleteQuestion(question);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task<Exam> GetExistingExamAsync(int examId)
    {
        var exam = await _unitOfWork.Exams.GetByIdAsync(examId);

        if (exam is null)
        {
            throw new KeyNotFoundException("Exam not found.");
        }

        return exam;
    }

    private async Task<ExamSection> GetExistingSectionAsync(int sectionId)
    {
        var section = await _unitOfWork.Exams.GetSectionByIdAsync(sectionId);

        if (section is null)
        {
            throw new KeyNotFoundException("Section not found.");
        }

        return section;
    }

    private async Task<ExamQuestion> GetExistingQuestionAsync(int questionId)
    {
        var question = await _unitOfWork.Exams.GetQuestionByIdAsync(questionId);

        if (question is null)
        {
            throw new KeyNotFoundException("Question not found.");
        }

        return question;
    }

    private static void ValidateOptionalSkillType(string? skillType)
    {
        if (!string.IsNullOrWhiteSpace(skillType))
        {
            ValidateSkillType(skillType);
        }
    }

    private static void ValidateSkillType(string skillType)
    {
        if (!ValidSkillTypes.Contains(skillType))
        {
            throw new InvalidOperationException("Skill type must be reading, listening, writing, or speaking.");
        }
    }

    private static string NormalizeRequired(string value)
    {
        return value.Trim().ToLowerInvariant();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static ExamDetailResponse HideAnswers(ExamDetailResponse response)
    {
        foreach (var section in response.Sections)
        {
            foreach (var question in section.Questions)
            {
                question.CorrectAnswer = string.Empty;
                question.Explanation = null;

                foreach (var option in question.Options)
                {
                    option.IsCorrect = false;
                }
            }
        }

        return response;
    }
}
