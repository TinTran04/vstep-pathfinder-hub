namespace DataAccessLayer.Entities;

public class DictionaryEntry
{
    public int Id { get; set; }

    public string Word { get; set; } = string.Empty;

    public string? Phonetic { get; set; }

    public string? AudioUrl { get; set; }

    public string? PartOfSpeech { get; set; }

    public string EnglishDefinition { get; set; } = string.Empty;

    public string VietnameseMeaning { get; set; } = string.Empty;

    public string? Example { get; set; }

    public string? ExampleVietnamese { get; set; }

    public DateTime CreatedAt { get; set; }

    public ICollection<UserVocabulary> UserVocabularies { get; set; } = new List<UserVocabulary>();
}
