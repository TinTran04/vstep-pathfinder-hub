namespace DataAccessLayer.Core.Parameters;

public class ExamQueryParameters
{
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 10;

    public string? SkillType { get; set; }

    public bool? IsPublished { get; set; }

    public string? Search { get; set; }
}
