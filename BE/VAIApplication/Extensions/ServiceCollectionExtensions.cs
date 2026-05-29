using BusinessLogicLayer.Core.Mappings;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.Integrations.Email;
using BusinessLogicLayer.Services.Implements;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Repositories.Implements;
using DataAccessLayer.Repositories.Interfaces;
using DataAccessLayer.UoW;

namespace VAIApplication.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.Configure<SmtpSettings>(configuration.GetSection("Smtp"));
        services.Configure<OtpSettings>(configuration.GetSection("Otp"));
        services.Configure<R2Settings>(configuration.GetSection("R2"));
        services.Configure<SupabaseSettings>(configuration.GetSection("Supabase"));
        services.Configure<MyMemorySettings>(configuration.GetSection("MyMemory"));
        services.Configure<PayOsSettings>(configuration.GetSection("PayOs"));
        services.Configure<OpenRouterSettings>(configuration.GetSection("OpenRouter"));

        services.AddAutoMapper(typeof(AuthMappingProfile).Assembly);

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<ISubscriptionPlanRepository, SubscriptionPlanRepository>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IExamAttemptRepository, ExamAttemptRepository>();
        services.AddScoped<IWritingSubmissionRepository, WritingSubmissionRepository>();
        services.AddScoped<ISpeakingSubmissionRepository, SpeakingSubmissionRepository>();
        services.AddScoped<IDictionaryEntryRepository, DictionaryEntryRepository>();
        services.AddScoped<IUserVocabularyRepository, UserVocabularyRepository>();
        services.AddScoped<IPaymentTransactionRepository, PaymentTransactionRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IReadingExamImportService, ReadingExamImportService>();
        services.AddScoped<IListeningExamImportService, ListeningExamImportService>();
        services.AddScoped<IListeningAudioService, ListeningAudioService>();
        services.AddScoped<IPracticeService, PracticeService>();
        services.AddScoped<IWritingPracticeService, WritingPracticeService>();
        services.AddScoped<ISpeakingPracticeService, SpeakingPracticeService>();
        services.AddScoped<IR2StorageService, R2StorageService>();
        services.AddScoped<ISupabaseStorageService, SupabaseStorageService>();
        services.AddScoped<IDictionaryService, DictionaryService>();
        services.AddScoped<IPaymentService, PaymentService>();

        services.AddHttpClient<IDictionaryApiService, DictionaryApiService>(client =>
        {
            client.BaseAddress = new Uri("https://api.dictionaryapi.dev/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHttpClient<ITranslationService, TranslationService>(client =>
        {
            client.BaseAddress = new Uri("https://api.mymemory.translated.net/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHttpClient<IPayOsGateway, PayOsGateway>((provider, client) =>
        {
            var settings = configuration.GetSection("PayOs").Get<PayOsSettings>() ?? new PayOsSettings();
            client.BaseAddress = new Uri(string.IsNullOrWhiteSpace(settings.BaseUrl)
                ? "https://api-merchant.payos.vn/"
                : settings.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        services.AddHttpClient<IOpenRouterGradingService, OpenRouterGradingService>((provider, client) =>
        {
            var settings = configuration.GetSection("OpenRouter").Get<OpenRouterSettings>() ?? new OpenRouterSettings();
            client.BaseAddress = new Uri(string.IsNullOrWhiteSpace(settings.BaseUrl)
                ? "https://openrouter.ai/"
                : settings.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(90);
        });

        return services;
    }
}
