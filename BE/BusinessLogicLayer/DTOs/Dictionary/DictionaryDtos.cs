using System.ComponentModel.DataAnnotations;
using BusinessLogicLayer.DTOs.Common;

namespace BusinessLogicLayer.DTOs.Dictionary;

public class DictionarySearchRequest
{
    [Required]
    [MaxLength(100)]
    public string Word { get; set; } = string.Empty;
}

public class MyWordsQueryRequest : PaginationRequest
{
    public bool? IsFavorite { get; set; }
}

public class UpdateVocabularyNoteRequest
{
    [Range(1, int.MaxValue)]
    public int DictionaryEntryId { get; set; }

    [MaxLength(2000)]
    public string? PersonalNote { get; set; }
}

public class ToggleVocabularyFavoriteRequest
{
    [Range(1, int.MaxValue)]
    public int DictionaryEntryId { get; set; }

    public bool IsFavorite { get; set; }
}

public class DictionaryEntryResponse
{
    public int DictionaryEntryId { get; set; }

    public string Word { get; set; } = string.Empty;

    public string? Phonetic { get; set; }

    public string? AudioUrl { get; set; }

    public string? PartOfSpeech { get; set; }

    public string EnglishDefinition { get; set; } = string.Empty;

    public string VietnameseMeaning { get; set; } = string.Empty;

    public string? Example { get; set; }

    public string? ExampleVietnamese { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class UserVocabularyResponse
{
    public int UserVocabularyId { get; set; }

    public int DictionaryEntryId { get; set; }

    public string Word { get; set; } = string.Empty;

    public string? Phonetic { get; set; }

    public string? AudioUrl { get; set; }

    public string? PartOfSpeech { get; set; }

    public string EnglishDefinition { get; set; } = string.Empty;

    public string VietnameseMeaning { get; set; } = string.Empty;

    public string? Example { get; set; }

    public string? ExampleVietnamese { get; set; }

    public string? PersonalNote { get; set; }

    public bool IsFavorite { get; set; }

    public int ReviewCount { get; set; }

    public DateTime? LastReviewedAt { get; set; }

    public DateTime? NextReviewAt { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class DictionarySearchResponse
{
    public DictionaryEntryResponse Entry { get; set; } = new();

    public UserVocabularyResponse UserVocabulary { get; set; } = new();

    public bool FromCache { get; set; }
}
