using DataAccessLayer.Context;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class UserVocabularyRepository : IUserVocabularyRepository
{
    private readonly ApplicationDbContext _context;

    public UserVocabularyRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<UserVocabulary?> GetByUserAndEntryAsync(int userId, int dictionaryEntryId)
    {
        return _context.UserVocabularies
            .AsNoTracking()
            .Where(item => item.UserId == userId && item.DictionaryEntryId == dictionaryEntryId)
            .Select(item => new UserVocabulary
            {
                Id = item.Id,
                UserId = item.UserId,
                DictionaryEntryId = item.DictionaryEntryId,
                PersonalNote = item.PersonalNote,
                IsFavorite = item.IsFavorite,
                ReviewCount = item.ReviewCount,
                LastReviewedAt = item.LastReviewedAt,
                NextReviewAt = item.NextReviewAt,
                CreatedAt = item.CreatedAt,
                DictionaryEntry = new DictionaryEntry
                {
                    Id = item.DictionaryEntry.Id,
                    Word = item.DictionaryEntry.Word,
                    Phonetic = item.DictionaryEntry.Phonetic,
                    AudioUrl = item.DictionaryEntry.AudioUrl,
                    PartOfSpeech = item.DictionaryEntry.PartOfSpeech,
                    EnglishDefinition = item.DictionaryEntry.EnglishDefinition,
                    VietnameseMeaning = item.DictionaryEntry.VietnameseMeaning,
                    Example = item.DictionaryEntry.Example,
                    ExampleVietnamese = item.DictionaryEntry.ExampleVietnamese,
                    CreatedAt = item.DictionaryEntry.CreatedAt
                }
            })
            .FirstOrDefaultAsync();
    }

    public Task<UserVocabulary?> GetTrackedByUserAndEntryAsync(int userId, int dictionaryEntryId)
    {
        return _context.UserVocabularies
            .FirstOrDefaultAsync(item => item.UserId == userId && item.DictionaryEntryId == dictionaryEntryId);
    }

    public async Task<(List<UserVocabulary> Items, int TotalCount)> GetPagedAsync(UserVocabularyQueryParameters query)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 100 ? 10 : query.PageSize;

        var vocabularyQuery = _context.UserVocabularies
            .AsNoTracking()
            .Where(item => item.UserId == query.UserId);

        if (query.IsFavorite.HasValue)
        {
            vocabularyQuery = vocabularyQuery.Where(item => item.IsFavorite == query.IsFavorite.Value);
        }

        var totalCount = await vocabularyQuery.CountAsync();
        var items = await vocabularyQuery
            .OrderByDescending(item => item.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => new UserVocabulary
            {
                Id = item.Id,
                UserId = item.UserId,
                DictionaryEntryId = item.DictionaryEntryId,
                PersonalNote = item.PersonalNote,
                IsFavorite = item.IsFavorite,
                ReviewCount = item.ReviewCount,
                LastReviewedAt = item.LastReviewedAt,
                NextReviewAt = item.NextReviewAt,
                CreatedAt = item.CreatedAt,
                DictionaryEntry = new DictionaryEntry
                {
                    Id = item.DictionaryEntry.Id,
                    Word = item.DictionaryEntry.Word,
                    Phonetic = item.DictionaryEntry.Phonetic,
                    AudioUrl = item.DictionaryEntry.AudioUrl,
                    PartOfSpeech = item.DictionaryEntry.PartOfSpeech,
                    EnglishDefinition = item.DictionaryEntry.EnglishDefinition,
                    VietnameseMeaning = item.DictionaryEntry.VietnameseMeaning,
                    Example = item.DictionaryEntry.Example,
                    ExampleVietnamese = item.DictionaryEntry.ExampleVietnamese,
                    CreatedAt = item.DictionaryEntry.CreatedAt
                }
            })
            .ToListAsync();

        return (items, totalCount);
    }

    public Task AddAsync(UserVocabulary userVocabulary)
    {
        return _context.UserVocabularies.AddAsync(userVocabulary).AsTask();
    }

    public void Detach(UserVocabulary userVocabulary)
    {
        _context.Entry(userVocabulary).State = EntityState.Detached;
    }
}
