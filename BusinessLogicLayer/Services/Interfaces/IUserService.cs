using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Users;

namespace BusinessLogicLayer.Services.Interfaces;

public interface IUserService
{
    Task<PagedResponse<UserListItemResponse>> GetUsersAsync(UserQueryRequest request);

    Task<UserResponse> GetUserByIdAsync(int userId);

    Task<UserResponse> CreateUserAsync(CreateUserRequest request);

    Task<UserResponse> UpdateUserAsync(int userId, UpdateUserRequest request);

    Task<UserResponse> UpdateMyProfileAsync(int userId, UpdateMyProfileRequest request);

    Task DeleteUserAsync(int userId);
}
