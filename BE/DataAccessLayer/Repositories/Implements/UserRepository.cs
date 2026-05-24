using DataAccessLayer.Context;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<User?> GetByIdAsync(int userId)
    {
        return _context.Users
            .AsNoTracking()
            .Include(user => user.Role)
            .Include(user => user.SubscriptionPlan)
            .FirstOrDefaultAsync(user => user.UserId == userId);
    }

    public Task<User?> GetTrackedByIdAsync(int userId)
    {
        return _context.Users
            .FirstOrDefaultAsync(user => user.UserId == userId);
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        return _context.Users
            .Include(user => user.Role)
            .Include(user => user.SubscriptionPlan)
            .FirstOrDefaultAsync(user => user.Email == email);
    }

    public Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        return _context.Users
            .Include(user => user.Role)
            .Include(user => user.SubscriptionPlan)
            .FirstOrDefaultAsync(user => user.RefreshToken == refreshToken);
    }

    public Task AddAsync(User user)
    {
        return _context.Users.AddAsync(user).AsTask();
    }

    public Task<bool> ExistsByEmailAsync(string email)
    {
        return _context.Users
            .AsNoTracking()
            .AnyAsync(user => user.Email == email);
    }

    public Task<bool> ExistsByEmailExceptUserAsync(string email, int userId)
    {
        return _context.Users
            .AsNoTracking()
            .AnyAsync(user => user.Email == email && user.UserId != userId);
    }

    public async Task<(List<User> Users, int TotalCount)> GetPagedAsync(UserQueryParameters query)
    {
        var usersQuery = _context.Users
            .AsNoTracking()
            .Include(user => user.Role)
            .Include(user => user.SubscriptionPlan)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            usersQuery = usersQuery.Where(user =>
                user.FullName.ToLower().Contains(search) ||
                user.Email.ToLower().Contains(search));
        }

        if (query.RoleId.HasValue)
        {
            usersQuery = usersQuery.Where(user => user.RoleId == query.RoleId.Value);
        }

        if (query.SubscriptionPlanId.HasValue)
        {
            usersQuery = usersQuery.Where(user => user.SubscriptionPlanId == query.SubscriptionPlanId.Value);
        }

        if (query.EmailConfirmed.HasValue)
        {
            usersQuery = usersQuery.Where(user => user.EmailConfirmed == query.EmailConfirmed.Value);
        }

        var pageNumber = query.PageNumber < 1 ? 1 : query.PageNumber;
        var pageSize = query.PageSize is < 1 or > 100 ? 10 : query.PageSize;
        var totalCount = await usersQuery.CountAsync();
        var users = await usersQuery
            .OrderByDescending(user => user.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (users, totalCount);
    }

    public void Update(User user)
    {
        _context.Users.Update(user);
    }

    public void SoftDelete(User user)
    {
        user.IsDeleted = true;
        _context.Users.Update(user);
    }
}
