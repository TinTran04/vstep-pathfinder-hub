using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Dictionary;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IDictionaryService
{
    Task<DictionarySearchResponse> SearchAsync(int userId, DictionarySearchRequest request);

    Task<PagedResponse<UserVocabularyResponse>> GetMyWordsAsync(int userId, MyWordsQueryRequest request);

    Task<UserVocabularyResponse> UpdateNoteAsync(int userId, UpdateVocabularyNoteRequest request);

    Task<UserVocabularyResponse> ToggleFavoriteAsync(int userId, ToggleVocabularyFavoriteRequest request);
}
