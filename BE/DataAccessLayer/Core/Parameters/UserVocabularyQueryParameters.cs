namespace DataAccessLayer.Core.Parameters;

public class UserVocabularyQueryParameters
{
    public int UserId { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 10;

    public bool? IsFavorite { get; set; }
}
