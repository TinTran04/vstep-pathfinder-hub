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
    private readonly R2Settings _settings;

    public R2StorageService(IOptions<R2Settings> options)
    {
        _settings = options.Value;
    }

    public Task<(string UploadUrl, string ObjectKey, DateTime ExpiresAt)> CreateSpeakingUploadUrlAsync(int userId, int examId, string contentType)
    {
        EnsureConfigured();

        var expiresAt = DateTime.UtcNow.AddMinutes(UploadUrlMinutes);
        var safeContentType = string.IsNullOrWhiteSpace(contentType) ? "audio/webm" : contentType.Trim();
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
        return Task.FromResult((uploadUrl, objectKey, expiresAt));
    }

    public string GetObjectUrl(string objectKey)
    {
        EnsureConfigured();
        var endpoint = _settings.Endpoint.TrimEnd('/');
        var bucketName = _settings.BucketName.Trim('/');
        return $"{endpoint}/{bucketName}/{objectKey.TrimStart('/')}";
    }

    private AmazonS3Client CreateClient()
    {
        var credentials = new BasicAWSCredentials(_settings.AccessKey, _settings.SecretKey);
        var config = new AmazonS3Config
        {
            ServiceURL = _settings.Endpoint,
            ForcePathStyle = true,
            AuthenticationRegion = RegionEndpoint.USEast1.SystemName
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
}
