namespace DataAccessLayer.Entities;

public class ExamAttemptAnswer
{
    public int AnswerId { get; set; }

    public int AttemptId { get; set; }

    public int QuestionId { get; set; }

    public string UserAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public decimal Score { get; set; }

    public DateTime CreatedAt { get; set; }

    public ExamAttempt? Attempt { get; set; }

    public ExamQuestion? Question { get; set; }
}
