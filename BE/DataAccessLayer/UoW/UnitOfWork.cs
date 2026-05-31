using DataAccessLayer.Context;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

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
        IUserVocabularyRepository userVocabularies,
        IPaymentTransactionRepository paymentTransactions)
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
        PaymentTransactions = paymentTransactions;
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

    public IPaymentTransactionRepository PaymentTransactions { get; }

    public Task<int> SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }

    public async Task ExecuteInTransactionAsync(Func<Task> operation)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        await operation();
        await transaction.CommitAsync();
    }
}
