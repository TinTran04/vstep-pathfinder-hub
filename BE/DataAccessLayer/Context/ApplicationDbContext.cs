using DataAccessLayer.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Context;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();

    public DbSet<Exam> Exams => Set<Exam>();

    public DbSet<ExamSection> ExamSections => Set<ExamSection>();

    public DbSet<ExamQuestion> ExamQuestions => Set<ExamQuestion>();

    public DbSet<ExamOption> ExamOptions => Set<ExamOption>();

    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();

    public DbSet<ExamAttemptAnswer> ExamAttemptAnswers => Set<ExamAttemptAnswer>();

    public DbSet<WritingSubmission> WritingSubmissions => Set<WritingSubmission>();

    public DbSet<SpeakingSubmission> SpeakingSubmissions => Set<SpeakingSubmission>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries()
            .Where(entry => entry.Entity is User or Role or SubscriptionPlan or Exam or ExamSection or ExamQuestion or ExamAttempt or WritingSubmission or SpeakingSubmission))
        {
            if (entry.State == EntityState.Added)
            {
                entry.CurrentValues[nameof(User.CreatedAt)] = utcNow;
                entry.CurrentValues[nameof(User.UpdatedAt)] = utcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.CurrentValues[nameof(User.UpdatedAt)] = utcNow;
            }
        }

        foreach (var entry in ChangeTracker.Entries<ExamAttemptAnswer>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = utcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(user => user.UserId);

            entity.Property(user => user.UserId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(user => user.Email)
                .IsUnique();

            entity.Property(user => user.FullName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.RoleId)
                .HasDefaultValue(3);

            entity.Property(user => user.SubscriptionPlanId)
                .HasDefaultValue(1);

            entity.Property(user => user.RefreshToken)
                .HasMaxLength(512);

            entity.Property(user => user.EmailConfirmed)
                .HasDefaultValue(false);

            entity.Property(user => user.EmailOtpHash)
                .HasMaxLength(255);

            entity.Property(user => user.OtpFailedCount)
                .HasDefaultValue(0);

            entity.Property(user => user.CreatedAt)
                .IsRequired();

            entity.Property(user => user.UpdatedAt)
                .IsRequired();

            entity.Property(user => user.IsDeleted)
                .HasDefaultValue(false);

            entity.HasOne(user => user.Role)
                .WithMany(role => role.Users)
                .HasForeignKey(user => user.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(user => user.SubscriptionPlan)
                .WithMany(plan => plan.Users)
                .HasForeignKey(user => user.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(user => !user.IsDeleted);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");

            entity.HasKey(role => role.RoleId);

            entity.Property(role => role.RoleId)
                .ValueGeneratedOnAdd();

            entity.Property(role => role.Name)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(role => role.Description)
                .HasMaxLength(255);

            entity.Property(role => role.IsActive)
                .HasDefaultValue(true);

            entity.Property(role => role.CreatedAt)
                .IsRequired();

            entity.Property(role => role.UpdatedAt)
                .IsRequired();

            entity.HasIndex(role => role.Name)
                .IsUnique();

            var seedTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            entity.HasData(
                new Role
                {
                    RoleId = 1,
                    Name = "admin",
                    Description = "System administrator",
                    IsActive = true,
                    CreatedAt = seedTime,
                    UpdatedAt = seedTime
                },
                new Role
                {
                    RoleId = 2,
                    Name = "staff",
                    Description = "Staff user",
                    IsActive = true,
                    CreatedAt = seedTime,
                    UpdatedAt = seedTime
                },
                new Role
                {
                    RoleId = 3,
                    Name = "user",
                    Description = "Normal user",
                    IsActive = true,
                    CreatedAt = seedTime,
                    UpdatedAt = seedTime
                });
        });

        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.ToTable("SubscriptionPlans");

            entity.HasKey(plan => plan.SubscriptionPlanId);

            entity.Property(plan => plan.SubscriptionPlanId)
                .ValueGeneratedOnAdd();

            entity.Property(plan => plan.Name)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(plan => plan.Description)
                .HasMaxLength(255);

            entity.Property(plan => plan.Price)
                .HasColumnType("numeric(18,2)");

            entity.Property(plan => plan.IsActive)
                .HasDefaultValue(true);

            entity.Property(plan => plan.CreatedAt)
                .IsRequired();

            entity.Property(plan => plan.UpdatedAt)
                .IsRequired();

            entity.HasIndex(plan => plan.Name)
                .IsUnique();

            var seedTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            entity.HasData(
                new SubscriptionPlan
                {
                    SubscriptionPlanId = 1,
                    Name = "free",
                    Description = "Free plan",
                    Price = 0,
                    DurationDays = 0,
                    DailyPracticeLimit = 1,
                    CanStoreSpeakingAudioForever = false,
                    SpeakingAudioRetentionDays = 4,
                    IsActive = true,
                    CreatedAt = seedTime,
                    UpdatedAt = seedTime
                },
                new SubscriptionPlan
                {
                    SubscriptionPlanId = 2,
                    Name = "weekly",
                    Description = "Weekly plan",
                    Price = 0,
                    DurationDays = 7,
                    DailyPracticeLimit = null,
                    CanStoreSpeakingAudioForever = true,
                    SpeakingAudioRetentionDays = 0,
                    IsActive = true,
                    CreatedAt = seedTime,
                    UpdatedAt = seedTime
                },
                new SubscriptionPlan
                {
                    SubscriptionPlanId = 3,
                    Name = "monthly",
                    Description = "Monthly plan",
                    Price = 0,
                    DurationDays = 30,
                    DailyPracticeLimit = null,
                    CanStoreSpeakingAudioForever = true,
                    SpeakingAudioRetentionDays = 0,
                    IsActive = true,
                    CreatedAt = seedTime,
                    UpdatedAt = seedTime
                });
        });

        modelBuilder.Entity<Exam>(entity =>
        {
            entity.ToTable("Exams");

            entity.HasKey(exam => exam.ExamId);

            entity.Property(exam => exam.ExamId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(exam => new { exam.SkillType, exam.IsPublished });

            entity.Property(exam => exam.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(exam => exam.SkillType)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(exam => exam.Description)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(exam => exam.AudioUrl)
                .HasMaxLength(1000);

            entity.Property(exam => exam.ImageUrl)
                .HasMaxLength(1000);

            entity.Property(exam => exam.IsPublished)
                .HasDefaultValue(false);

            entity.Property(exam => exam.IsDeleted)
                .HasDefaultValue(false);

            entity.HasMany(exam => exam.Sections)
                .WithOne(section => section.Exam)
                .HasForeignKey(section => section.ExamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(exam => !exam.IsDeleted);
        });

        modelBuilder.Entity<ExamSection>(entity =>
        {
            entity.ToTable("ExamSections");

            entity.HasKey(section => section.SectionId);

            entity.Property(section => section.SectionId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(section => new { section.ExamId, section.DisplayOrder });

            entity.Property(section => section.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(section => section.Instruction)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(section => section.AudioUrl)
                .HasMaxLength(1000);

            entity.Property(section => section.IsDeleted)
                .HasDefaultValue(false);

            entity.HasMany(section => section.Questions)
                .WithOne(question => question.Section)
                .HasForeignKey(question => question.SectionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(section => !section.IsDeleted);
        });

        modelBuilder.Entity<ExamQuestion>(entity =>
        {
            entity.ToTable("ExamQuestions");

            entity.HasKey(question => question.QuestionId);

            entity.Property(question => question.QuestionId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(question => new { question.SectionId, question.DisplayOrder });

            entity.Property(question => question.QuestionText)
                .HasMaxLength(3000)
                .IsRequired();

            entity.Property(question => question.QuestionType)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(question => question.CorrectAnswer)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(question => question.Explanation)
                .HasMaxLength(2000);

            entity.Property(question => question.Score)
                .HasPrecision(5, 2);

            entity.Property(question => question.IsDeleted)
                .HasDefaultValue(false);

            entity.HasMany(question => question.Options)
                .WithOne(option => option.Question)
                .HasForeignKey(option => option.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(question => !question.IsDeleted);
        });

        modelBuilder.Entity<ExamOption>(entity =>
        {
            entity.ToTable("ExamOptions");

            entity.HasKey(option => option.OptionId);

            entity.Property(option => option.OptionId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(option => new { option.QuestionId, option.Label })
                .IsUnique();

            entity.Property(option => option.Label)
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(option => option.Content)
                .HasMaxLength(2000)
                .IsRequired();

            entity.HasQueryFilter(option => option.Question != null && !option.Question.IsDeleted);
        });

        modelBuilder.Entity<ExamAttempt>(entity =>
        {
            entity.ToTable("ExamAttempts");

            entity.HasKey(attempt => attempt.AttemptId);

            entity.Property(attempt => attempt.AttemptId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(attempt => new { attempt.UserId, attempt.ExamId, attempt.Status });

            entity.Property(attempt => attempt.SkillType)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(attempt => attempt.Status)
                .HasMaxLength(20)
                .HasDefaultValue("in_progress")
                .IsRequired();

            entity.Property(attempt => attempt.Score)
                .HasPrecision(5, 2);

            entity.Property(attempt => attempt.IsDeleted)
                .HasDefaultValue(false);

            entity.HasOne(attempt => attempt.User)
                .WithMany(user => user.ExamAttempts)
                .HasForeignKey(attempt => attempt.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(attempt => attempt.Exam)
                .WithMany(exam => exam.Attempts)
                .HasForeignKey(attempt => attempt.ExamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(attempt => attempt.Answers)
                .WithOne(answer => answer.Attempt)
                .HasForeignKey(answer => answer.AttemptId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(attempt => !attempt.IsDeleted);
        });

        modelBuilder.Entity<ExamAttemptAnswer>(entity =>
        {
            entity.ToTable("ExamAttemptAnswers");

            entity.HasKey(answer => answer.AnswerId);

            entity.Property(answer => answer.AnswerId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(answer => new { answer.AttemptId, answer.QuestionId })
                .IsUnique();

            entity.Property(answer => answer.UserAnswer)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(answer => answer.Score)
                .HasPrecision(5, 2);

            entity.HasOne(answer => answer.Question)
                .WithMany()
                .HasForeignKey(answer => answer.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(answer => answer.Attempt != null && !answer.Attempt.IsDeleted);
        });

        modelBuilder.Entity<WritingSubmission>(entity =>
        {
            entity.ToTable("WritingSubmissions");

            entity.HasKey(submission => submission.WritingSubmissionId);

            entity.Property(submission => submission.WritingSubmissionId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(submission => new { submission.UserId, submission.ExamId, submission.Status });

            entity.Property(submission => submission.Prompt)
                .HasMaxLength(3000)
                .IsRequired();

            entity.Property(submission => submission.EssayText)
                .IsRequired();

            entity.Property(submission => submission.Status)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .IsRequired();

            entity.Property(submission => submission.Score)
                .HasPrecision(5, 2);

            entity.Property(submission => submission.Feedback)
                .HasMaxLength(2000);

            entity.Property(submission => submission.IsDeleted)
                .HasDefaultValue(false);

            entity.HasOne(submission => submission.User)
                .WithMany(user => user.WritingSubmissions)
                .HasForeignKey(submission => submission.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(submission => submission.Exam)
                .WithMany()
                .HasForeignKey(submission => submission.ExamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(submission => submission.Attempt)
                .WithMany()
                .HasForeignKey(submission => submission.AttemptId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasQueryFilter(submission => !submission.IsDeleted);
        });

        modelBuilder.Entity<SpeakingSubmission>(entity =>
        {
            entity.ToTable("SpeakingSubmissions");

            entity.HasKey(submission => submission.SpeakingSubmissionId);

            entity.Property(submission => submission.SpeakingSubmissionId)
                .ValueGeneratedOnAdd();

            entity.HasIndex(submission => new { submission.UserId, submission.ExamId, submission.Status });

            entity.Property(submission => submission.AudioObjectKey)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(submission => submission.AudioUrl)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(submission => submission.Status)
                .HasMaxLength(20)
                .HasDefaultValue("pending")
                .IsRequired();

            entity.Property(submission => submission.Score)
                .HasPrecision(5, 2);

            entity.Property(submission => submission.Feedback)
                .HasMaxLength(2000);

            entity.Property(submission => submission.IsDeleted)
                .HasDefaultValue(false);

            entity.HasOne(submission => submission.User)
                .WithMany(user => user.SpeakingSubmissions)
                .HasForeignKey(submission => submission.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(submission => submission.Exam)
                .WithMany()
                .HasForeignKey(submission => submission.ExamId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(submission => submission.Attempt)
                .WithMany()
                .HasForeignKey(submission => submission.AttemptId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasQueryFilter(submission => !submission.IsDeleted);
        });
    }
}
