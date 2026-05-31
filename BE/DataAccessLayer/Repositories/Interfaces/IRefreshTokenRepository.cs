using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetActiveByHashAsync(string tokenHash);

    Task AddAsync(RefreshToken refreshToken);

    void Revoke(RefreshToken refreshToken, string? replacedByTokenHash = null, string? revokedByIp = null);

    Task RevokeAllByUserIdAsync(int userId, string? revokedByIp = null);
}
