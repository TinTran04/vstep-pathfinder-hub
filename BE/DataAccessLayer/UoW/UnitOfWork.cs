using DataAccessLayer.Context;
using DataAccessLayer.Repositories.Interfaces;

namespace DataAccessLayer.UoW;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(
        ApplicationDbContext context,
        IUserRepository users,
        IRoleRepository roles,
        ISubscriptionPlanRepository subscriptionPlans,
        IExamRepository exams,
        IExamAttemptRepository examAttempts,
        IWritingSubmissionRepository writingSubmissions,
        ISpeakingSubmissionRepository speakingSubmissions,
        IDictionaryEntryRepository dictionaryEntries,
        IUserVocabularyRepository userVocabularies)
    {
        _context = context;
        Users = users;
        Roles = roles;
        SubscriptionPlans = subscriptionPlans;
        Exams = exams;
        ExamAttempts = examAttempts;
        WritingSubmissions = writingSubmissions;
        SpeakingSubmissions = speakingSubmissions;
        DictionaryEntries = dictionaryEntries;
        UserVocabularies = userVocabularies;
    }

    public IUserRepository Users { get; }

    public IRoleRepository Roles { get; }

    public ISubscriptionPlanRepository SubscriptionPlans { get; }

    public IExamRepository Exams { get; }

    public IExamAttemptRepository ExamAttempts { get; }

    public IWritingSubmissionRepository WritingSubmissions { get; }

    public ISpeakingSubmissionRepository SpeakingSubmissions { get; }

    public IDictionaryEntryRepository DictionaryEntries { get; }

    public IUserVocabularyRepository UserVocabularies { get; }

    public Task<int> SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}
