using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class DictionaryEntryRepository : IDictionaryEntryRepository
{
    private readonly ApplicationDbContext _context;

    public DictionaryEntryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<DictionaryEntry?> GetByWordAsync(string word)
    {
        return _context.DictionaryEntries
            .AsNoTracking()
            .Where(entry => entry.Word == word)
            .Select(entry => new DictionaryEntry
            {
                Id = entry.Id,
                Word = entry.Word,
                Phonetic = entry.Phonetic,
                AudioUrl = entry.AudioUrl,
                PartOfSpeech = entry.PartOfSpeech,
                EnglishDefinition = entry.EnglishDefinition,
                VietnameseMeaning = entry.VietnameseMeaning,
                Example = entry.Example,
                ExampleVietnamese = entry.ExampleVietnamese,
                CreatedAt = entry.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public Task AddAsync(DictionaryEntry entry)
    {
        return _context.DictionaryEntries.AddAsync(entry).AsTask();
    }

    public void Detach(DictionaryEntry entry)
    {
        _context.Entry(entry).State = EntityState.Detached;
    }
}
