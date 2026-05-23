using DataAccessLayer.Context;
using DataAccessLayer.Entities;
using DataAccessLayer.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories.Implements;

public class RoleRepository : IRoleRepository
{
    private readonly ApplicationDbContext _context;

    public RoleRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Role?> GetByIdAsync(int roleId)
    {
        return _context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(role => role.RoleId == roleId);
    }

    public Task<Role?> GetByNameAsync(string name)
    {
        return _context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(role => role.Name == name);
    }

    public Task<List<Role>> GetActiveRolesAsync()
    {
        return _context.Roles
            .AsNoTracking()
            .Where(role => role.IsActive)
            .OrderBy(role => role.RoleId)
            .ToListAsync();
    }
}
