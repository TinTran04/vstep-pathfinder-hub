using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int userId);

    Task<User?> GetTrackedByIdAsync(int userId);

    Task<User?> GetByEmailAsync(string email);

    Task<User?> GetByRefreshTokenAsync(string refreshToken);

    Task<bool> ExistsByEmailAsync(string email);

    Task<bool> ExistsByEmailExceptUserAsync(string email, int userId);

    Task<(List<User> Users, int TotalCount)> GetPagedAsync(UserQueryParameters query);

    Task AddAsync(User user);

    void Update(User user);

    void SoftDelete(User user);
}
