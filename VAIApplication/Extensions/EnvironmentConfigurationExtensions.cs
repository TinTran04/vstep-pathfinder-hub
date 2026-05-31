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
        SetIfPresent(configuration, "SMTP_HOST", "Smtp:Host");
        SetIfPresent(configuration, "SMTP_PORT", "Smtp:Port");
        SetIfPresent(configuration, "SMTP_USERNAME", "Smtp:Username");
        SetIfPresent(configuration, "SMTP_PASSWORD", "Smtp:Password");
        SetIfPresent(configuration, "SMTP_FROM_EMAIL", "Smtp:FromEmail");
        SetIfPresent(configuration, "SMTP_FROM_NAME", "Smtp:FromName");
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
