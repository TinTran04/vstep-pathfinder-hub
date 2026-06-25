using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class UserAvatarService : IUserAvatarService
{
    private static readonly Dictionary<string, (string Label, int UnlockStreakDays)> AvatarRegistry = new(StringComparer.OrdinalIgnoreCase)
    {
        { "avatar1", ("Cú Mèo", 0) },
        { "avatar2", ("Cáo Lửa", 7) },
        { "avatar3", ("Rùa Học Giả", 14) },
        { "avatar4", ("Mèo Hoang Dã", 21) },
        { "avatar5", ("Cáo Nâu", 30) },
        { "avatar6", ("Thằn Lằn Xanh", 45) },
        { "avatar7", ("Gấu Trúc", 60) },
        { "avatar8", ("Sư Tử Vàng", 90) },
    };

    private readonly IUnitOfWork _unitOfWork;
    private readonly IDashboardService _dashboardService;

    public UserAvatarService(IUnitOfWork unitOfWork, IDashboardService dashboardService)
    {
        _unitOfWork = unitOfWork;
        _dashboardService = dashboardService;
    }

    public async Task<UserAvatarResponse> GetUserAvatarsAsync(int userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        // Get current streak from dashboard
        var dashboard = await _dashboardService.GetMyDashboardAsync(userId);
        var currentStreakDays = dashboard.CurrentStreakDays;

        var unlockedAvatars = new List<AvatarInfo>();
        var lockedAvatars = new List<AvatarInfo>();

        bool canPickOne = string.IsNullOrEmpty(user.UnlockedAvatarKey) && currentStreakDays >= 7;

        foreach (var (avatarId, (label, _)) in AvatarRegistry)
        {
            var avatarInfo = new AvatarInfo
            {
                AvatarId = avatarId,
                Label = label,
                UnlockStreakDays = 7
            };

            // avatar1 is always unlocked
            // user.UnlockedAvatarKey is unlocked
            // If they can pick one, all are temporarily unlocked so they can click to choose
            bool isUnlocked = avatarId == "avatar1" || 
                              avatarId == user.UnlockedAvatarKey || 
                              (canPickOne && avatarId != "avatar1");

            if (isUnlocked)
                unlockedAvatars.Add(avatarInfo);
            else
                lockedAvatars.Add(avatarInfo);
        }

        return new UserAvatarResponse
        {
            ActiveAvatarId = user.AvatarKey,
            UnlockedAvatars = unlockedAvatars,
            LockedAvatars = lockedAvatars
        };
    }

    public async Task SetActiveAvatarAsync(int userId, string avatarId)
    {
        if (!AvatarRegistry.ContainsKey(avatarId))
            throw new ArgumentException($"Avatar '{avatarId}' không tồn tại.");

        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        // avatar1 is always free
        if (avatarId != "avatar1")
        {
            if (string.IsNullOrEmpty(user.UnlockedAvatarKey))
            {
                // First time unlocking: need 7 streak
                var dashboard = await _dashboardService.GetMyDashboardAsync(userId);
                if (dashboard.CurrentStreakDays < 7)
                    throw new InvalidOperationException("Bạn cần đạt ít nhất 7 ngày streak liên tiếp để mở khóa avatar.");
                
                // Save this as their 1 permanently unlocked avatar
                user.UnlockedAvatarKey = avatarId;
            }
            else if (avatarId != user.UnlockedAvatarKey)
            {
                // Already unlocked one, cannot pick a different locked one
                throw new InvalidOperationException("Bạn đã chọn mở khóa 1 avatar khác. Không thể chọn avatar này.");
            }
        }

        user.AvatarKey = avatarId;
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task CheckAndUnlockAvatarAsync(int userId, int streakDays)
    {
        // No-op: unlocks are calculated on-the-fly based on streak
        await Task.CompletedTask;
    }
}
