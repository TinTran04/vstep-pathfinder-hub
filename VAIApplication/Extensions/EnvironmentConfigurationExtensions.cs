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
