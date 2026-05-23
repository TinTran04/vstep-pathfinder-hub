using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BusinessLogicLayer.Services.Implements;

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly SupabaseSettings _settings;

    public SupabaseStorageService(IOptions<SupabaseSettings> options)
    {
        _settings = options.Value;
    }

    public string GetPublicAssetUrl(string bucketName, string objectPath)
    {
        if (string.IsNullOrWhiteSpace(_settings.Url))
        {
            throw new InvalidOperationException("Supabase URL is not configured.");
        }

        return $"{_settings.Url.TrimEnd('/')}/storage/v1/object/public/{bucketName.Trim('/')}/{objectPath.TrimStart('/')}";
    }
}
