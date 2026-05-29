using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IDictionaryEntryRepository
{
    Task<DictionaryEntry?> GetByWordAsync(string word);

    Task AddAsync(DictionaryEntry entry);

    void Detach(DictionaryEntry entry);
}
