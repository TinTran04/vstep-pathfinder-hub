using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using BusinessLogicLayer.Core.Settings;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;

namespace BusinessLogicLayer.Services.Implements;

public class R2StorageService : IR2StorageService
{
    private const int UploadUrlMinutes = 15;
    private const int ReadUrlMinutes = 15;
    private readonly R2Settings _settings;

    public R2StorageService(IOptions<R2Settings> options)
    {
        _settings = options.Value;
    }

    public Task<(string UploadUrl, string ObjectKey, string ContentType, DateTime ExpiresAt)> CreateSpeakingUploadUrlAsync(int userId, int examId, string contentType)
    {
        EnsureConfigured();

        var expiresAt = DateTime.UtcNow.AddMinutes(UploadUrlMinutes);
        var safeContentType = NormalizeAudioContentType(contentType, "audio/webm");
        var objectId = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        var objectKey = $"speaking/{userId}/{examId}/{objectId}.webm";

        using var client = CreateClient();
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _settings.BucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            Expires = expiresAt,
            ContentType = safeContentType
        };

        var uploadUrl = client.GetPreSignedURL(request);
        return Task.FromResult((uploadUrl, objectKey, safeContentType, expiresAt));
    }

    public Task<(string UploadUrl, string ObjectKey, string ContentType, DateTime ExpiresAt)> CreateListeningAudioUploadUrlAsync(
        int? examId,
        string contentType,
        string? fileExtension)
    {
        EnsureConfigured();

        var expiresAt = DateTime.UtcNow.AddMinutes(UploadUrlMinutes);
        var safeContentType = NormalizeAudioContentType(contentType, "audio/mpeg");
        var safeExtension = NormalizeAudioExtension(fileExtension, safeContentType);
        var objectId = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        var examSegment = examId is > 0 ? examId.Value.ToString() : "unassigned";
        var objectKey = $"listening/{examSegment}/{objectId}.{safeExtension}";

        using var client = CreateClient();
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _settings.BucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            Expires = expiresAt,
            ContentType = safeContentType
        };

        var uploadUrl = client.GetPreSignedURL(request);
        return Task.FromResult((uploadUrl, objectKey, safeContentType, expiresAt));
    }

    public Task<string> CreateReadUrlAsync(string objectKey)
    {
        EnsureConfigured();

        using var client = CreateClient();
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _settings.BucketName,
            Key = objectKey.TrimStart('/'),
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddMinutes(ReadUrlMinutes)
        };

        return Task.FromResult(client.GetPreSignedURL(request));
    }

    public string GetObjectUrl(string objectKey)
    {
        EnsureConfigured();
        var key = objectKey.TrimStart('/');

        if (!string.IsNullOrWhiteSpace(_settings.PublicBaseUrl))
        {
            return $"{_settings.PublicBaseUrl.TrimEnd('/')}/{key}";
        }

        var endpoint = _settings.Endpoint.TrimEnd('/');
        var bucketName = _settings.BucketName.Trim('/');
        return $"{endpoint}/{bucketName}/{key}";
    }

    private AmazonS3Client CreateClient()
    {
        AWSConfigsS3.UseSignatureVersion4 = true;

        var credentials = new BasicAWSCredentials(_settings.AccessKey, _settings.SecretKey);
        var config = new AmazonS3Config
        {
            ServiceURL = _settings.Endpoint,
            ForcePathStyle = true,
            AuthenticationRegion = "auto",
            SignatureVersion = "V4"
        };

        return new AmazonS3Client(credentials, config);
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_settings.AccessKey) ||
            string.IsNullOrWhiteSpace(_settings.SecretKey) ||
            string.IsNullOrWhiteSpace(_settings.BucketName) ||
            string.IsNullOrWhiteSpace(_settings.Endpoint))
        {
            throw new InvalidOperationException("Cloudflare R2 settings are not configured.");
        }
    }

    private static string NormalizeAudioExtension(string? fileExtension, string contentType)
    {
        var extension = string.IsNullOrWhiteSpace(fileExtension)
            ? ContentTypeToExtension(contentType)
            : fileExtension.Trim().TrimStart('.').ToLowerInvariant();

        return extension switch
        {
            "mp3" => "mp3",
            "mpeg" => "mp3",
            "wav" => "wav",
            "webm" => "webm",
            "ogg" => "ogg",
            "m4a" => "m4a",
            "mp4" => "m4a",
            _ => "mp3"
        };
    }

    private static string NormalizeAudioContentType(string? contentType, string defaultContentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return defaultContentType;
        }

        var normalized = contentType.Trim().ToLowerInvariant();
        return normalized switch
        {
            "audio/mpeg" => "audio/mpeg",
            "audio/mp3" => "audio/mpeg",
            "audio/wav" => "audio/wav",
            "audio/wave" => "audio/wav",
            "audio/x-wav" => "audio/wav",
            "audio/webm" => "audio/webm",
            "audio/ogg" => "audio/ogg",
            "audio/mp4" => "audio/mp4",
            "audio/x-m4a" => "audio/mp4",
            "audio/aac" => "audio/aac",
            "audio/flac" => "audio/flac",
            "audio/aiff" => "audio/aiff",
            _ => defaultContentType
        };
    }

    private static string ContentTypeToExtension(string contentType)
    {
        return contentType.Trim().ToLowerInvariant() switch
        {
            "audio/mpeg" => "mp3",
            "audio/mp3" => "mp3",
            "audio/wav" => "wav",
            "audio/wave" => "wav",
            "audio/x-wav" => "wav",
            "audio/webm" => "webm",
            "audio/ogg" => "ogg",
            "audio/mp4" => "m4a",
            "audio/x-m4a" => "m4a",
            "audio/aac" => "aac",
            "audio/flac" => "flac",
            "audio/aiff" => "aiff",
            _ => "mp3"
        };
    }
}
