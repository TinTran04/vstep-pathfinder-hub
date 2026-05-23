namespace BusinessLogicLayer.Services.Interfaces;

public interface ISupabaseStorageService
{
    string GetPublicAssetUrl(string bucketName, string objectPath);
}
