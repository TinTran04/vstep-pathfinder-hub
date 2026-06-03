using DataAccessLayer.Repositories.Interfaces;

namespace DataAccessLayer.UoW;

public interface IUnitOfWork
{
    IUserRepository Users { get; }

    IRoleRepository Roles { get; }

    ISubscriptionPlanRepository SubscriptionPlans { get; }

    IExamRepository Exams { get; }

    IExamAttemptRepository ExamAttempts { get; }

    IWritingSubmissionRepository WritingSubmissions { get; }

    ISpeakingSubmissionRepository SpeakingSubmissions { get; }

    IDictionaryEntryRepository DictionaryEntries { get; }

    IUserVocabularyRepository UserVocabularies { get; }

    IPaymentTransactionRepository PaymentTransactions { get; }

    IRefreshTokenRepository RefreshTokens { get; }

    IDashboardRepository Dashboard { get; }

    IUserRewardLedgerRepository UserRewardLedgers { get; }

    Task<int> SaveChangesAsync();

    Task ExecuteInTransactionAsync(Func<Task> operation);
}
