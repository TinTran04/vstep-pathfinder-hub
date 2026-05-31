using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IUserVocabularyRepository
{
    Task<UserVocabulary?> GetByUserAndEntryAsync(int userId, int dictionaryEntryId);

    Task<UserVocabulary?> GetTrackedByUserAndEntryAsync(int userId, int dictionaryEntryId);

    Task<(List<UserVocabulary> Items, int TotalCount)> GetPagedAsync(UserVocabularyQueryParameters query);

    Task AddAsync(UserVocabulary userVocabulary);

    void Detach(UserVocabulary userVocabulary);
}
