using AutoMapper;
using BusinessLogicLayer.DTOs.Auth;
using DataAccessLayer.Entities;

namespace BusinessLogicLayer.Core.Mappings;

public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        CreateMap<RegisterRequest, User>()
            .ForMember(destination => destination.UserId, options => options.Ignore())
            .ForMember(destination => destination.PasswordHash, options => options.Ignore())
            .ForMember(destination => destination.RoleId, options => options.Ignore())
            .ForMember(destination => destination.Role, options => options.Ignore())
            .ForMember(destination => destination.SubscriptionPlanId, options => options.Ignore())
            .ForMember(destination => destination.SubscriptionPlan, options => options.Ignore())
            .ForMember(destination => destination.RefreshToken, options => options.Ignore())
            .ForMember(destination => destination.RefreshTokenExpiryTime, options => options.Ignore())
            .ForMember(destination => destination.IsDeleted, options => options.Ignore())
            .ForMember(destination => destination.CreatedAt, options => options.Ignore())
            .ForMember(destination => destination.UpdatedAt, options => options.Ignore());

        CreateMap<User, AuthResponse>()
            .ForMember(destination => destination.Role, options => options.MapFrom(source => source.Role.Name))
            .ForMember(destination => destination.SubscriptionPlan, options => options.MapFrom(source => source.SubscriptionPlan.Name))
            .ForMember(destination => destination.AccessToken, options => options.Ignore())
            .ForMember(destination => destination.RefreshToken, options => options.Ignore())
            .ForMember(destination => destination.AccessTokenExpiresAt, options => options.Ignore())
            .ForMember(destination => destination.RefreshTokenExpiresAt, options => options.Ignore());
    }
}
