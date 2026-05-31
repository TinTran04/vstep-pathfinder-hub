using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ApplicationDbContext _context;

    public RefreshTokenRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<RefreshToken?> GetActiveByHashAsync(string tokenHash)
    {
        var utcNow = DateTime.UtcNow;
        return _context.RefreshTokens
            .Include(token => token.User)
                .ThenInclude(user => user.Role)
            .Include(token => token.User)
                .ThenInclude(user => user.SubscriptionPlan)
            .FirstOrDefaultAsync(token =>
                token.TokenHash == tokenHash &&
                token.RevokedAt == null &&
                token.ExpiresAt > utcNow);
    }

    public Task AddAsync(RefreshToken refreshToken)
    {
        return _context.RefreshTokens.AddAsync(refreshToken).AsTask();
    }

    public void Revoke(RefreshToken refreshToken, string? replacedByTokenHash = null, string? revokedByIp = null)
    {
        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.ReplacedByTokenHash = replacedByTokenHash;
        refreshToken.RevokedByIp = revokedByIp;
    }

    public async Task RevokeAllByUserIdAsync(int userId, string? revokedByIp = null)
    {
        var utcNow = DateTime.UtcNow;
        var tokens = await _context.RefreshTokens
            .Where(token =>
                token.UserId == userId &&
                token.RevokedAt == null &&
                token.ExpiresAt > utcNow)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.RevokedAt = utcNow;
            token.RevokedByIp = revokedByIp;
        }
    }
}
