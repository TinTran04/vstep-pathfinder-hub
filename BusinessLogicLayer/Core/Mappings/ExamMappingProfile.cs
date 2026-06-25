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

        CreateMap<ExamSection, SectionReviewResponse>();
        CreateMap<ExamQuestion, QuestionReviewResponse>();
        CreateMap<ExamAttempt, AttemptResultResponse>();

        // Mappings from Response DTOs to Review DTOs for GetAttemptReviewAsync
        CreateMap<SectionResponse, SectionReviewResponse>();
        CreateMap<QuestionResponse, QuestionReviewResponse>();

        CreateMap<WritingSubmission, WritingSubmissionResponse>()
            .AfterMap(MapWritingFeedback);
        CreateMap<WritingSubmission, WritingResultResponse>()
            .AfterMap(MapWritingFeedback);
        CreateMap<SpeakingSubmission, SpeakingSubmissionResponse>()
            .AfterMap(MapSpeakingFeedback);
        CreateMap<SpeakingSubmission, SpeakingResultResponse>()
            .AfterMap(MapSpeakingFeedback);
    }

    private void MapWritingFeedback(WritingSubmission src, WritingSubmissionResponse dest)
    {
        if (string.IsNullOrWhiteSpace(src.FeedbackJson)) return;
        try {
            using var doc = System.Text.Json.JsonDocument.Parse(src.FeedbackJson);
            var root = doc.RootElement;
            if (root.TryGetProperty("task_response", out var tr) && tr.TryGetDecimal(out var trVal)) dest.TaskResponse = trVal;
            if (root.TryGetProperty("grammar", out var g) && g.TryGetDecimal(out var gVal)) dest.Grammar = gVal;
            if (root.TryGetProperty("vocabulary", out var v) && v.TryGetDecimal(out var vVal)) dest.Vocabulary = vVal;
            if (root.TryGetProperty("organization", out var o) && o.TryGetDecimal(out var oVal)) dest.Organization = oVal;
            dest.FeedbackPoints = ParseFeedbackPoints(root);
        } catch { }
    }

    private void MapSpeakingFeedback(SpeakingSubmission src, SpeakingSubmissionResponse dest)
    {
        if (string.IsNullOrWhiteSpace(src.FeedbackJson)) return;
        try {
            using var doc = System.Text.Json.JsonDocument.Parse(src.FeedbackJson);
            var root = doc.RootElement;
            if (root.TryGetProperty("fluency", out var f) && f.TryGetDecimal(out var fVal)) dest.Fluency = fVal;
            if (root.TryGetProperty("pronunciation", out var p) && p.TryGetDecimal(out var pVal)) dest.Pronunciation = pVal;
            if (root.TryGetProperty("grammar", out var g) && g.TryGetDecimal(out var gVal)) dest.Grammar = gVal;
            if (root.TryGetProperty("vocabulary", out var v) && v.TryGetDecimal(out var vVal)) dest.Vocabulary = vVal;
            if (root.TryGetProperty("topicDevelopment", out var td) && td.TryGetDecimal(out var tdVal)) dest.TopicDevelopment = tdVal;
            else if (root.TryGetProperty("relevance", out var r) && r.TryGetDecimal(out var rVal)) dest.TopicDevelopment = rVal;
            dest.FeedbackPoints = ParseFeedbackPoints(root);
        } catch { }
    }

    private static System.Collections.Generic.List<string> ParseFeedbackPoints(System.Text.Json.JsonElement root)
    {
        var list = new System.Collections.Generic.List<string>();
        if (root.TryGetProperty("feedback", out var f))
        {
            if (f.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var item in f.EnumerateArray())
                {
                    if (item.ValueKind == System.Text.Json.JsonValueKind.String)
                    {
                        var str = item.GetString();
                        if (!string.IsNullOrWhiteSpace(str)) list.Add(str);
                    }
                }
            }
            else if (f.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                var str = f.GetString();
                if (!string.IsNullOrWhiteSpace(str)) list.Add(str);
            }
        }
        return list;
    }
}
