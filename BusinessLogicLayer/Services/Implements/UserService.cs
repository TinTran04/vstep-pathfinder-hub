using AutoMapper;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Users;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Core.Parameters;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;

namespace BusinessLogicLayer.Services.Implements;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UserService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResponse<UserListItemResponse>> GetUsersAsync(UserQueryRequest request)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize is < 1 or > 100 ? 10 : request.PageSize;
        var query = new UserQueryParameters
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            Search = request.Search?.Trim(),
            RoleId = request.RoleId,
            SubscriptionPlanId = request.SubscriptionPlanId,
            EmailConfirmed = request.EmailConfirmed
        };

        var (users, totalCount) = await _unitOfWork.Users.GetPagedAsync(query);

        return new PagedResponse<UserListItemResponse>
        {
            Items = _mapper.Map<List<UserListItemResponse>>(users),
            Page = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = pageSize <= 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<UserResponse> GetUserByIdAsync(int userId)
    {
        var user = await GetExistingUserAsync(userId);
        return _mapper.Map<UserResponse>(user);
    }

    public async Task<UserResponse> CreateUserAsync(CreateUserRequest request)
    {
        await ValidateRoleAsync(request.RoleId);
        await ValidateSubscriptionPlanAsync(request.SubscriptionPlanId);

        var normalizedEmail = NormalizeEmail(request.Email);

        if (await _unitOfWork.Users.ExistsByEmailAsync(normalizedEmail))
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var user = _mapper.Map<User>(request);
        user.FullName = request.FullName.Trim();
        user.Email = normalizedEmail;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        user.RoleId = request.RoleId;
        user.SubscriptionPlanId = request.SubscriptionPlanId;
        user.EmailConfirmed = request.EmailConfirmed;
        user.IsDeleted = false;

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return await GetUserByIdAsync(user.UserId);
    }

    public async Task<UserResponse> UpdateUserAsync(int userId, UpdateUserRequest request)
    {
        await ValidateRoleAsync(request.RoleId);
        await ValidateSubscriptionPlanAsync(request.SubscriptionPlanId);

        var user = await GetExistingTrackedUserAsync(userId);

        user.FullName = request.FullName.Trim();
        user.RoleId = request.RoleId;
        user.SubscriptionPlanId = request.SubscriptionPlanId;
        user.EmailConfirmed = request.EmailConfirmed;

        await _unitOfWork.SaveChangesAsync();

        return await GetUserByIdAsync(user.UserId);
    }

    public async Task DeleteUserAsync(int userId)
    {
        var user = await GetExistingTrackedUserAsync(userId);

        _unitOfWork.Users.SoftDelete(user);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task<User> GetExistingUserAsync(int userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);

        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        return user;
    }

    private async Task<User> GetExistingTrackedUserAsync(int userId)
    {
        var user = await _unitOfWork.Users.GetTrackedByIdAsync(userId);

        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        return user;
    }

    private async Task ValidateRoleAsync(int roleId)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(roleId);

        if (role is null || !role.IsActive)
        {
            throw new InvalidOperationException("Role does not exist or is inactive.");
        }
    }

    private async Task ValidateSubscriptionPlanAsync(int subscriptionPlanId)
    {
        var subscriptionPlan = await _unitOfWork.SubscriptionPlans.GetByIdAsync(subscriptionPlanId);

        if (subscriptionPlan is null || !subscriptionPlan.IsActive)
        {
            throw new InvalidOperationException("Subscription plan does not exist or is inactive.");
        }
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

}
