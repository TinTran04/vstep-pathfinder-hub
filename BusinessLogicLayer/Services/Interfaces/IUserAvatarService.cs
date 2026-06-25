namespace BusinessLogicLayer.Services.Interfaces;

public interface IUserAvatarService
{
    Task<UserAvatarResponse> GetUserAvatarsAsync(int userId);
    Task SetActiveAvatarAsync(int userId, string avatarId);
    Task CheckAndUnlockAvatarAsync(int userId, int streakDays);
}

public class UserAvatarResponse
{
    public string ActiveAvatarId { get; set; } = "avatar1";
    public List<AvatarInfo> UnlockedAvatars { get; set; } = new();
    public List<AvatarInfo> LockedAvatars { get; set; } = new();
}

public class AvatarInfo
{
    public string AvatarId { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int UnlockStreakDays { get; set; }
}
