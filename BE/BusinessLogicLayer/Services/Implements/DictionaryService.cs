using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Dictionary;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogicLayer.Services.Implements;

public class DictionaryService : IDictionaryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDictionaryApiService _dictionaryApiService;
    private readonly ITranslationService _translationService;

    public DictionaryService(
        IUnitOfWork unitOfWork,
        IDictionaryApiService dictionaryApiService,
        ITranslationService translationService)
    {
        _unitOfWork = unitOfWork;
        _dictionaryApiService = dictionaryApiService;
        _translationService = translationService;
    }

    public async Task<DictionarySearchResponse> SearchAsync(int userId, DictionarySearchRequest request)
    {
        var word = NormalizeWord(request.Word);
        var entry = await _unitOfWork.DictionaryEntries.GetByWordAsync(word);
        var fromCache = entry is not null;

        if (entry is null)
        {
            entry = await _dictionaryApiService.GetEntryAsync(word);
            entry.VietnameseMeaning = await _translationService.TranslateEnToViAsync(entry.EnglishDefinition);

            if (!string.IsNullOrWhiteSpace(entry.Example))
            {
                entry.ExampleVietnamese = await _translationService.TranslateEnToViAsync(entry.Example);
            }

            if (string.IsNullOrWhiteSpace(entry.VietnameseMeaning))
            {
                entry.VietnameseMeaning = entry.EnglishDefinition;
            }

            await _unitOfWork.DictionaryEntries.AddAsync(entry);
            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                _unitOfWork.DictionaryEntries.Detach(entry);
                entry = await _unitOfWork.DictionaryEntries.GetByWordAsync(word)
                    ?? throw new InvalidOperationException("Dictionary cache write conflicted and could not be reloaded.");
                fromCache = true;
            }
        }

        var userVocabulary = await _unitOfWork.UserVocabularies.GetTrackedByUserAndEntryAsync(userId, entry.Id);
        if (userVocabulary is null)
        {
            userVocabulary = new UserVocabulary
            {
                UserId = userId,
                DictionaryEntryId = entry.Id
            };

            await _unitOfWork.UserVocabularies.AddAsync(userVocabulary);
            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                _unitOfWork.UserVocabularies.Detach(userVocabulary);
                userVocabulary = await _unitOfWork.UserVocabularies.GetTrackedByUserAndEntryAsync(userId, entry.Id)
                    ?? throw new InvalidOperationException("Personal dictionary write conflicted and could not be reloaded.");
            }
        }

        userVocabulary.DictionaryEntry = entry;

        return new DictionarySearchResponse
        {
            Entry = MapEntry(entry),
            UserVocabulary = MapUserVocabulary(userVocabulary),
            FromCache = fromCache
        };
    }

    public async Task<PagedResponse<UserVocabularyResponse>> GetMyWordsAsync(int userId, MyWordsQueryRequest request)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize is < 1 or > 100 ? 10 : request.PageSize;
        var query = new UserVocabularyQueryParameters
        {
            UserId = userId,
            Page = page,
            PageSize = pageSize,
            IsFavorite = request.IsFavorite
        };

        var (items, totalCount) = await _unitOfWork.UserVocabularies.GetPagedAsync(query);

        return new PagedResponse<UserVocabularyResponse>
        {
            Items = items.Select(MapUserVocabulary).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = pageSize <= 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<UserVocabularyResponse> UpdateNoteAsync(int userId, UpdateVocabularyNoteRequest request)
    {
        var userVocabulary = await GetExistingTrackedUserVocabularyAsync(userId, request.DictionaryEntryId);
        userVocabulary.PersonalNote = NormalizeNullable(request.PersonalNote);
        await _unitOfWork.SaveChangesAsync();

        return await GetUserVocabularyResponseAsync(userId, request.DictionaryEntryId);
    }

    public async Task<UserVocabularyResponse> ToggleFavoriteAsync(int userId, ToggleVocabularyFavoriteRequest request)
    {
        var userVocabulary = await GetExistingTrackedUserVocabularyAsync(userId, request.DictionaryEntryId);
        userVocabulary.IsFavorite = request.IsFavorite;
        await _unitOfWork.SaveChangesAsync();

        return await GetUserVocabularyResponseAsync(userId, request.DictionaryEntryId);
    }

    private async Task<UserVocabulary> GetExistingTrackedUserVocabularyAsync(int userId, int dictionaryEntryId)
    {
        var userVocabulary = await _unitOfWork.UserVocabularies.GetTrackedByUserAndEntryAsync(userId, dictionaryEntryId);
        if (userVocabulary is null)
        {
            throw new KeyNotFoundException("Vocabulary item not found in your dictionary.");
        }

        return userVocabulary;
    }

    private async Task<UserVocabularyResponse> GetUserVocabularyResponseAsync(int userId, int dictionaryEntryId)
    {
        var userVocabulary = await _unitOfWork.UserVocabularies.GetByUserAndEntryAsync(userId, dictionaryEntryId)
            ?? throw new KeyNotFoundException("Vocabulary item not found in your dictionary.");
        return MapUserVocabulary(userVocabulary);
    }

    private static DictionaryEntryResponse MapEntry(DictionaryEntry entry)
    {
        return new DictionaryEntryResponse
        {
            DictionaryEntryId = entry.Id,
            Word = entry.Word,
            Phonetic = entry.Phonetic,
            AudioUrl = entry.AudioUrl,
            PartOfSpeech = entry.PartOfSpeech,
            EnglishDefinition = entry.EnglishDefinition,
            VietnameseMeaning = entry.VietnameseMeaning,
            Example = entry.Example,
            ExampleVietnamese = entry.ExampleVietnamese,
            CreatedAt = entry.CreatedAt
        };
    }

    private static UserVocabularyResponse MapUserVocabulary(UserVocabulary userVocabulary)
    {
        var entry = userVocabulary.DictionaryEntry;
        return new UserVocabularyResponse
        {
            UserVocabularyId = userVocabulary.Id,
            DictionaryEntryId = userVocabulary.DictionaryEntryId,
            Word = entry.Word,
            Phonetic = entry.Phonetic,
            AudioUrl = entry.AudioUrl,
            PartOfSpeech = entry.PartOfSpeech,
            EnglishDefinition = entry.EnglishDefinition,
            VietnameseMeaning = entry.VietnameseMeaning,
            Example = entry.Example,
            ExampleVietnamese = entry.ExampleVietnamese,
            PersonalNote = userVocabulary.PersonalNote,
            IsFavorite = userVocabulary.IsFavorite,
            ReviewCount = userVocabulary.ReviewCount,
            LastReviewedAt = userVocabulary.LastReviewedAt,
            NextReviewAt = userVocabulary.NextReviewAt,
            CreatedAt = userVocabulary.CreatedAt
        };
    }

    private static string NormalizeWord(string word)
    {
        var normalized = word.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new InvalidOperationException("Word is required.");
        }

        if (normalized.Length > 100)
        {
            throw new InvalidOperationException("Word must be 100 characters or fewer.");
        }

        return normalized;
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
