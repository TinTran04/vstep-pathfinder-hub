namespace VAIApplication.Extensions;

public static class EnvironmentConfigurationExtensions
{
    public static IConfiguration ApplyEnvironmentVariableMappings(this IConfiguration configuration)
    {
        SetIfPresent(configuration, "DB_CONNECTION_STRING", "ConnectionStrings:DefaultConnection");
        SetIfPresent(configuration, "JWT_KEY", "Jwt:Key");
        SetIfPresent(configuration, "JWT_ISSUER", "Jwt:Issuer");
        SetIfPresent(configuration, "JWT_AUDIENCE", "Jwt:Audience");
        SetIfPresent(configuration, "JWT_DURATION_MINUTES", "Jwt:DurationInMinutes");
        SetIfPresent(configuration, "BREVO_API_KEY", "Brevo:ApiKey");
        SetIfPresent(configuration, "BREVO_FROM_EMAIL", "Brevo:FromEmail");
        SetIfPresent(configuration, "BREVO_FROM_NAME", "Brevo:FromName");
        SetIfPresent(configuration, "BREVO_BASE_URL", "Brevo:BaseUrl");
        SetIfPresent(configuration, "OTP_EXPIRE_MINUTES", "Otp:ExpireMinutes");
        SetIfPresent(configuration, "R2_ACCESS_KEY", "R2:AccessKey");
        SetIfPresent(configuration, "R2_SECRET_KEY", "R2:SecretKey");
        SetIfPresent(configuration, "R2_BUCKET_NAME", "R2:BucketName");
        SetIfPresent(configuration, "R2_ENDPOINT", "R2:Endpoint");
        SetIfPresent(configuration, "R2_PUBLIC_BASE_URL", "R2:PublicBaseUrl");
        SetIfPresent(configuration, "MYMEMORY_EMAIL", "MyMemory:Email");
        SetIfPresent(configuration, "OPENROUTER_API_KEY", "OpenRouter:ApiKey");
        SetIfPresent(configuration, "OPENROUTER_MODEL", "OpenRouter:Model");
        SetIfPresent(configuration, "OPENROUTER_BASE_URL", "OpenRouter:BaseUrl");
        SetIfPresent(configuration, "OPENROUTER_SITE_URL", "OpenRouter:SiteUrl");
        SetIfPresent(configuration, "OPENROUTER_APP_NAME", "OpenRouter:AppName");
        SetIfPresent(configuration, "OPENROUTER_MAX_AUDIO_BYTES", "OpenRouter:MaxAudioBytes");
        SetIfPresent(configuration, "PAYOS_CLIENT_ID", "PayOs:ClientId");
        SetIfPresent(configuration, "PAYOS_API_KEY", "PayOs:ApiKey");
        SetIfPresent(configuration, "PAYOS_CHECKSUM_KEY", "PayOs:ChecksumKey");
        SetIfPresent(configuration, "PAYOS_RETURN_URL", "PayOs:ReturnUrl");
        SetIfPresent(configuration, "PAYOS_CANCEL_URL", "PayOs:CancelUrl");
        SetIfPresent(configuration, "PAYOS_BASE_URL", "PayOs:BaseUrl");
        SetIfPresent(configuration, "SUPABASE_URL", "Supabase:Url");
        SetIfPresent(configuration, "SUPABASE_ANON_KEY", "Supabase:AnonKey");
        SetIfPresent(configuration, "SUPABASE_SERVICE_ROLE_KEY", "Supabase:ServiceRoleKey");

        SetIfPresent(configuration, "AI_PRIMARY_PROVIDER", "Ai:PrimaryProvider");
        SetIfPresent(configuration, "AI_FALLBACK_PROVIDER", "Ai:FallbackProvider");
        SetIfPresent(configuration, "BAI_API_KEY", "Bai:ApiKey");
        SetIfPresent(configuration, "BAI_BASE_URL", "Bai:BaseUrl");
        SetIfPresent(configuration, "BAI_MODEL", "Bai:Model");

        return configuration;
    }

    private static void SetIfPresent(IConfiguration configuration, string environmentVariable, string configurationKey)
    {
        var value = Environment.GetEnvironmentVariable(environmentVariable);

        if (!string.IsNullOrWhiteSpace(value))
        {
            configuration[configurationKey] = value;
        }
    }
}
