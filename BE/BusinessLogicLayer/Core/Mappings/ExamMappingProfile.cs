using AutoMapper;
using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.DTOs.Speaking;
using BusinessLogicLayer.DTOs.Writing;
using DataAccessLayer.Entities;

namespace BusinessLogicLayer.Core.Mappings;

public class ExamMappingProfile : Profile
{
    public ExamMappingProfile()
    {
        CreateMap<Exam, ExamResponse>();
        CreateMap<Exam, ExamDetailResponse>();
        CreateMap<ExamSection, SectionResponse>();
        CreateMap<ExamQuestion, QuestionResponse>();
        CreateMap<ExamOption, OptionResponse>();
        CreateMap<ExamAttemptAnswer, AttemptAnswerResponse>();
        CreateMap<ExamAttempt, AttemptResultResponse>();
        CreateMap<WritingSubmission, WritingSubmissionResponse>();
        CreateMap<WritingSubmission, WritingResultResponse>();
        CreateMap<SpeakingSubmission, SpeakingSubmissionResponse>();
        CreateMap<SpeakingSubmission, SpeakingResultResponse>();
    }
}
