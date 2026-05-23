using BusinessLogicLayer.DTOs.Common;

namespace BusinessLogicLayer.DTOs.Exam;

public class ExamQueryRequest : PaginationRequest
{
    public string? SkillType { get; set; }

    public bool? IsPublished { get; set; }

    public string? Search { get; set; }
}
