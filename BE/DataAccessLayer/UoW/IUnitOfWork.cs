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

    Task<int> SaveChangesAsync();
}
