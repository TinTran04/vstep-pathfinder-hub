using DataAccessLayer.Entities;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IDictionaryApiService
{
    Task<DictionaryEntry> GetEntryAsync(string word);
}
