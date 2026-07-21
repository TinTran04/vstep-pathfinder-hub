using AutoMapper;
using BusinessLogicLayer.DTOs.Users;
using DataAccessLayer.Entities;

namespace BusinessLogicLayer.Core.Mappings;

public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<User, UserResponse>()
            .ForMember(destination => destination.Role, options => options.MapFrom(source => source.Role.Name))
            .ForMember(destination => destination.SubscriptionPlan, options => options.MapFrom(source => source.SubscriptionPlan.Name));

        CreateMap<User, UserListItemResponse>()
            .ForMember(destination => destination.Role, options => options.MapFrom(source => source.Role.Name))
            .ForMember(destination => destination.SubscriptionPlan, options => options.MapFrom(source => source.SubscriptionPlan.Name))
            .ForMember(destination => destination.ExamsCompleted, options => options.MapFrom(source => source.ExamAttempts.Count));

        CreateMap<CreateUserRequest, User>()
            .ForMember(destination => destination.UserId, options => options.Ignore())
            .ForMember(destination => destination.Role, options => options.Ignore())
            .ForMember(destination => destination.SubscriptionPlan, options => options.Ignore())
            .ForMember(destination => destination.SubscriptionExpiresAt, options => options.Ignore())
            .ForMember(destination => destination.AvatarKey, options => options.Ignore())
            .ForMember(destination => destination.PasswordHash, options => options.Ignore())
            .ForMember(destination => destination.RefreshTokens, options => options.Ignore())
            .ForMember(destination => destination.EmailOtpHash, options => options.Ignore())
            .ForMember(destination => destination.EmailOtpExpiryTime, options => options.Ignore())
            .ForMember(destination => destination.OtpFailedCount, options => options.Ignore())
            .ForMember(destination => destination.OtpLastSentAt, options => options.Ignore())
            .ForMember(destination => destination.IsDeleted, options => options.Ignore())
            .ForMember(destination => destination.CreatedAt, options => options.Ignore())
            .ForMember(destination => destination.UpdatedAt, options => options.Ignore());

        CreateMap<UpdateUserRequest, User>()
            .ForMember(destination => destination.UserId, options => options.Ignore())
            .ForMember(destination => destination.Role, options => options.Ignore())
            .ForMember(destination => destination.SubscriptionPlan, options => options.Ignore())
            .ForMember(destination => destination.SubscriptionExpiresAt, options => options.Ignore())
            .ForMember(destination => destination.Email, options => options.Ignore())
            .ForMember(destination => destination.PasswordHash, options => options.Ignore())
            .ForMember(destination => destination.RefreshTokens, options => options.Ignore())
            .ForMember(destination => destination.EmailOtpHash, options => options.Ignore())
            .ForMember(destination => destination.EmailOtpExpiryTime, options => options.Ignore())
            .ForMember(destination => destination.OtpFailedCount, options => options.Ignore())
            .ForMember(destination => destination.OtpLastSentAt, options => options.Ignore())
            .ForMember(destination => destination.CreatedAt, options => options.Ignore())
            .ForMember(destination => destination.UpdatedAt, options => options.Ignore());
    }
}
