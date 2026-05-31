namespace DataAccessLayer.Entities;

public class UserVocabulary
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public int DictionaryEntryId { get; set; }

    public DictionaryEntry DictionaryEntry { get; set; } = null!;

    public string? PersonalNote { get; set; }

    public bool IsFavorite { get; set; }

    public int ReviewCount { get; set; }

    public DateTime? LastReviewedAt { get; set; }

    public DateTime? NextReviewAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
