using DataAccessLayer.Entities;

namespace DataAccessLayer.Repositories.Interfaces;

public interface IRoleRepository
{
    Task<Role?> GetByIdAsync(int roleId);

    Task<Role?> GetByNameAsync(string name);

    Task<List<Role>> GetActiveRolesAsync();
}
