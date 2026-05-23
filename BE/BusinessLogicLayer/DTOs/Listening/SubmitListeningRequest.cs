using System.ComponentModel.DataAnnotations;
using BusinessLogicLayer.DTOs.Common;

namespace BusinessLogicLayer.DTOs.Listening;

public class SubmitListeningRequest
{
    [Range(0, int.MaxValue)]
    public int DurationUsedSeconds { get; set; }

    [MinLength(1)]
    public List<SubmitAnswerRequest> Answers { get; set; } = new();
}
