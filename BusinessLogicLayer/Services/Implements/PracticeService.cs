using AutoMapper;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;
using Microsoft.Extensions.DependencyInjection;

namespace BusinessLogicLayer.Services.Implements;

public class PracticeService : IPracticeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IRewardService _rewardService;
    private readonly Microsoft.Extensions.DependencyInjection.IServiceScopeFactory _scopeFactory;

    public PracticeService(IUnitOfWork unitOfWork, IMapper mapper, IRewardService rewardService, Microsoft.Extensions.DependencyInjection.IServiceScopeFactory scopeFactory)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _rewardService = rewardService;
        _scopeFactory = scopeFactory;
    }

    public async Task<StartPracticeResponse> StartPracticeAsync(int userId, int examId, string expectedSkillType)
    {
        var user = await GetExistingUserAsync(userId);
        var exam = await GetPublishedExamAsync(examId, expectedSkillType);

        var draftMeta = new { _meta = new { mode = $"practice_{expectedSkillType}" } };
        var attempt = new ExamAttempt
        {
            UserId = user.UserId,
            ExamId = exam.ExamId,
            SkillType = expectedSkillType,
            Status = "in_progress",
            StartedAt = DateTime.UtcNow,
            DurationMinutes = exam.DurationMinutes,
            ExpiresAt = DateTime.UtcNow.AddMinutes(exam.DurationMinutes),
            DraftStateJson = System.Text.Json.JsonSerializer.Serialize(draftMeta)
        };

        await _unitOfWork.ExamAttempts.AddAsync(attempt);
        await _unitOfWork.SaveChangesAsync();

        return new StartPracticeResponse
        {
            AttemptId = attempt.AttemptId,
            ExamId = exam.ExamId,
            SkillType = attempt.SkillType,
            Status = attempt.Status,
            StartedAt = attempt.StartedAt,
            Exam = HideAnswers(_mapper.Map<ExamDetailResponse>(exam))
        };
    }

    public async Task<SubmitPracticeResponse> SubmitPracticeAsync(
        int userId,
        int attemptId,
        string expectedSkillType,
        IReadOnlyList<SubmitAnswerRequest> answers,
        int durationUsedSeconds)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetByIdAsync(attemptId);

        if (attempt is null || attempt.UserId != userId)
        {
            throw new KeyNotFoundException("Attempt not found.");
        }

        if (attempt.SkillType != expectedSkillType || attempt.Exam?.SkillType != expectedSkillType)
        {
            throw new InvalidOperationException("Attempt skill type is invalid.");
        }

        if (attempt.Status != "in_progress")
        {
            throw new InvalidOperationException("Attempt has already been submitted.");
        }

        var user = await GetExistingUserAsync(userId);

        if (IsFreeUser(user) && await _unitOfWork.ExamAttempts.HasSubmittedAttemptAsync(userId, attempt.ExamId))
        {
            throw new InvalidOperationException("Free users can only submit this exam once.");
        }

        var questions = await _unitOfWork.Exams.GetQuestionsForScoringAsync(attempt.ExamId);

        if (questions.Count == 0)
        {
            throw new InvalidOperationException("Exam has no scorable questions.");
        }

        var answerMap = answers
            .GroupBy(answer => answer.QuestionId)
            .ToDictionary(group => group.Key, group => group.First().UserAnswer.Trim());

        var correctCount = 0;
        decimal totalScore = 0;

        foreach (var question in questions)
        {
            answerMap.TryGetValue(question.QuestionId, out var userAnswer);
            userAnswer ??= string.Empty;

            var isCorrect = IsAnswerCorrect(question, userAnswer);
            var answerScore = isCorrect ? question.Score : 0;

            if (isCorrect)
            {
                correctCount++;
                totalScore += answerScore;
            }

            await _unitOfWork.ExamAttempts.AddAnswerAsync(new ExamAttemptAnswer
            {
                AttemptId = attempt.AttemptId,
                QuestionId = question.QuestionId,
                UserAnswer = userAnswer,
                IsCorrect = isCorrect,
                Score = answerScore
            });
        }

        attempt.Status = "scored";
        attempt.SubmittedAt = DateTime.UtcNow;
        attempt.TotalQuestions = questions.Count;
        attempt.CorrectCount = correctCount;
        attempt.Score = totalScore;
        attempt.DurationUsedSeconds = durationUsedSeconds;

        _unitOfWork.ExamAttempts.Update(attempt);
        await _unitOfWork.SaveChangesAsync();

        await _rewardService.AwardActivityRewardsAsync(
            userId,
            "exam_attempt",
            attempt.AttemptId,
            attempt.Exam?.ExamMode ?? "test",
            CalculateScoreOnTen(correctCount, questions.Count));

        return new SubmitPracticeResponse
        {
            AttemptId = attempt.AttemptId,
            Status = attempt.Status,
            Score = totalScore,
            TotalQuestions = questions.Count,
            CorrectCount = correctCount,
            SubmittedAt = attempt.SubmittedAt
        };
    }

    public async Task<AttemptResultResponse> GetResultAsync(int userId, int attemptId)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetResultByIdAsync(attemptId);

        if (attempt is null || attempt.UserId != userId)
        {
            throw new KeyNotFoundException("Attempt not found.");
        }

        return _mapper.Map<AttemptResultResponse>(attempt);
    }

    public async Task<AttemptReviewResponse> GetAttemptReviewAsync(int userId, int attemptId, bool isPrivileged = false)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetResultByIdAsync(attemptId);

        if (attempt is null || (!isPrivileged && attempt.UserId != userId))
        {
            throw new KeyNotFoundException("Attempt not found.");
        }

        var exam = await _unitOfWork.Exams.GetDetailByIdAsync(attempt.ExamId);
        if (exam is null)
        {
            throw new KeyNotFoundException("Exam not found.");
        }

        var compositeExam = await GetCompositeExamForAttemptAsync(attempt, exam, false);

        var reviewResponse = new AttemptReviewResponse
        {
            AttemptId = attempt.AttemptId,
            ExamId = attempt.ExamId,
            UserId = attempt.UserId,
            SkillType = attempt.SkillType,
            ExamTitle = compositeExam.Title,
            Status = attempt.Status,
            TotalScore = attempt.Score,
            OverallScore = attempt.Score,
            TotalQuestions = attempt.TotalQuestions,
            CorrectCount = attempt.CorrectCount,
            DurationUsedSeconds = attempt.DurationUsedSeconds,
            StartedAt = attempt.StartedAt,
            SubmittedAt = attempt.SubmittedAt,
            CompletedAt = attempt.CompletedAt,
            Sections = compositeExam.Sections.Select(s => _mapper.Map<SectionReviewResponse>(s)).ToList()
        };

        var isCompleted = attempt.Status == "submitted" || attempt.Status == "scored" || attempt.Status == "completed";

        var answerMap = attempt.Answers.ToDictionary(a => a.QuestionId, a => a);

        foreach (var section in reviewResponse.Sections)
        {
            foreach (var question in section.Questions)
            {
                if (answerMap.TryGetValue(question.QuestionId, out var answer))
                {
                    question.UserAnswer = answer.UserAnswer;
                    question.IsCorrectAnswer = isCompleted && answer.IsCorrect;
                }

                if (!isCompleted)
                {
                    question.CorrectAnswer = string.Empty;
                    question.Explanation = null;
                    question.IsCorrectAnswer = false;

                    foreach (var option in question.Options)
                    {
                        option.IsCorrect = false;
                    }
                }
            }
        }

        var writingSubmission = await _unitOfWork.WritingSubmissions.GetByAttemptIdAsync(attemptId)
            ?? await _unitOfWork.WritingSubmissions.GetLatestByExamAsync(userId, attempt.ExamId);

        if (writingSubmission != null)
        {
            reviewResponse.WritingReview = new WritingReviewResponse
            {
                WritingSubmissionId = writingSubmission.WritingSubmissionId,
                Prompt = writingSubmission.Prompt,
                EssayText = writingSubmission.EssayText,
                Status = writingSubmission.Status,
                Score = writingSubmission.Score,
                DurationUsedSeconds = writingSubmission.DurationUsedSeconds,
                Feedback = writingSubmission.Feedback,
                FeedbackJson = writingSubmission.FeedbackJson,
                CreatedAt = writingSubmission.CreatedAt
            };
        }

        // Get all speaking submissions for mock tests (one per part)
        var speakingSubmissions = await _unitOfWork.SpeakingSubmissions.GetAllByAttemptIdAsync(attemptId);

        if (speakingSubmissions.Any())
        {
            // For backward compatibility, populate SpeakingReview with the first one
            var firstSubmission = speakingSubmissions.First();
            reviewResponse.SpeakingReview = new SpeakingReviewResponse
            {
                SpeakingSubmissionId = firstSubmission.SpeakingSubmissionId,
                PartNumber = firstSubmission.PartNumber,
                AudioUrl = firstSubmission.AudioUrl,
                Status = firstSubmission.Status,
                Score = firstSubmission.Score,
                DurationUsedSeconds = firstSubmission.DurationUsedSeconds,
                Feedback = firstSubmission.Feedback,
                FeedbackJson = firstSubmission.FeedbackJson,
                Transcript = firstSubmission.Transcript,
                CreatedAt = firstSubmission.CreatedAt
            };

            // Populate SpeakingReviews with all submissions
            foreach (var submission in speakingSubmissions)
            {
                reviewResponse.SpeakingReviews.Add(new SpeakingReviewResponse
                {
                    SpeakingSubmissionId = submission.SpeakingSubmissionId,
                    PartNumber = submission.PartNumber,
                    AudioUrl = submission.AudioUrl,
                    Status = submission.Status,
                    Score = submission.Score,
                    DurationUsedSeconds = submission.DurationUsedSeconds,
                    Feedback = submission.Feedback,
                    FeedbackJson = submission.FeedbackJson,
                    Transcript = submission.Transcript,
                    CreatedAt = submission.CreatedAt
                });
            }
        }
        else
        {
            // Fall back to latest for non-attempt submissions
            var speakingSubmission = await _unitOfWork.SpeakingSubmissions.GetLatestByExamAsync(userId, attempt.ExamId);
            if (speakingSubmission != null)
            {
                reviewResponse.SpeakingReview = new SpeakingReviewResponse
                {
                    SpeakingSubmissionId = speakingSubmission.SpeakingSubmissionId,
                    PartNumber = speakingSubmission.PartNumber,
                    AudioUrl = speakingSubmission.AudioUrl,
                    Status = speakingSubmission.Status,
                    Score = speakingSubmission.Score,
                    DurationUsedSeconds = speakingSubmission.DurationUsedSeconds,
                    Feedback = speakingSubmission.Feedback,
                    FeedbackJson = speakingSubmission.FeedbackJson,
                    Transcript = speakingSubmission.Transcript,
                    CreatedAt = speakingSubmission.CreatedAt
                };
            }
        }

        return reviewResponse;
    }

    public async Task<InProgressAttemptResponse?> GetInProgressAttemptAsync(int userId)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetInProgressAttemptAsync(userId);
        if (attempt is null)
        {
            return null;
        }

        if (await ExpireAndSubmitAttemptIfNeededAsync(userId, attempt))
        {
            return null;
        }

        var skillDurations = ExtractSkillDurations(attempt.DraftStateJson);

        return new InProgressAttemptResponse
        {
            AttemptId = attempt.AttemptId,
            Status = attempt.Status,
            StartedAt = attempt.StartedAt,
            ExpiresAt = attempt.ExpiresAt,
            DurationMinutes = attempt.DurationMinutes,
            ServerNow = DateTime.UtcNow,
            RemainingSeconds = attempt.ExpiresAt.HasValue
                ? (int)Math.Max(0, (attempt.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds)
                : 0,
            CurrentSkill = attempt.CurrentSkill,
            DraftStateJson = attempt.DraftStateJson,
            SkillDurations = skillDurations,
            Exam = await GetCompositeExamForAttemptAsync(attempt, attempt.Exam, true)
        };
    }

    public async Task AutosaveAttemptAsync(int userId, int attemptId, AutosaveRequest request)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetByIdAsync(attemptId);
        if (attempt is null || attempt.UserId != userId)
        {
            throw new KeyNotFoundException("Attempt not found.");
        }

        if (attempt.Status != "in_progress")
        {
            throw new InvalidOperationException("Attempt is not in progress.");
        }

        if (attempt.ExpiresAt.HasValue && DateTime.UtcNow > attempt.ExpiresAt.Value)
        {
            throw new InvalidOperationException("Attempt has expired.");
        }

        attempt.CurrentSkill = request.CurrentSkill ?? attempt.CurrentSkill;
        
        if (!string.IsNullOrEmpty(request.DraftStateJson))
        {
            attempt.DraftStateJson = MergeDraftStateJson(attempt.DraftStateJson, request.DraftStateJson);
        }
        
        attempt.LastAutosavedAt = request.ClientUpdatedAt ?? DateTime.UtcNow;
        attempt.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.ExamAttempts.Update(attempt);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<SubmitPracticeResponse> SubmitMockTestAsync(int userId, int attemptId, SubmitMockTestRequest request)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetByIdAsync(attemptId);

        if (attempt is null || attempt.UserId != userId)
        {
            throw new KeyNotFoundException("Attempt not found.");
        }

        if (attempt.Status != "in_progress" && attempt.Status != "auto_submitting")
        {
            throw new InvalidOperationException("Attempt has already been submitted.");
        }

        if (!string.IsNullOrEmpty(request.DraftStateJson))
        {
            attempt.DraftStateJson = MergeDraftStateJson(attempt.DraftStateJson, request.DraftStateJson);
            _unitOfWork.ExamAttempts.Update(attempt);
            await _unitOfWork.SaveChangesAsync();
        }

        var json = attempt.DraftStateJson;
        if (string.IsNullOrEmpty(json))
        {
            throw new InvalidOperationException("No draft state to submit.");
        }

        MockTestPayload? payload;
        try
        {
            payload = System.Text.Json.JsonSerializer.Deserialize<MockTestPayload>(json, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            throw new InvalidOperationException("Invalid draft state format.");
        }

        var questions = await _unitOfWork.Exams.GetQuestionsForScoringAsync(attempt.ExamId);
        
        var answerMap = new Dictionary<int, string>();
        if (payload?.Listening?.Answers != null)
        {
            foreach (var kvp in payload.Listening.Answers) answerMap[kvp.Key] = kvp.Value;
        }
        if (payload?.Reading?.Answers != null)
        {
            foreach (var kvp in payload.Reading.Answers) answerMap[kvp.Key] = kvp.Value;
        }

        var correctCount = 0;
        decimal totalScore = 0;

        foreach (var question in questions)
        {
            answerMap.TryGetValue(question.QuestionId, out var userAnswer);
            userAnswer ??= string.Empty;

            var isCorrect = IsAnswerCorrect(question, userAnswer);
            var answerScore = isCorrect ? question.Score : 0;

            if (isCorrect)
            {
                correctCount++;
                totalScore += answerScore;
            }

            await _unitOfWork.ExamAttempts.AddAnswerAsync(new ExamAttemptAnswer
            {
                AttemptId = attempt.AttemptId,
                QuestionId = question.QuestionId,
                UserAnswer = userAnswer,
                IsCorrect = isCorrect,
                Score = answerScore
            });
        }

        // Process Writing
        WritingSubmission? writingSubmission = null;
        if (payload?.Writing != null && payload.Writing.Any())
        {
            var essayText = string.Join("\n\n", payload.Writing.Select(kvp => $"--- {kvp.Key} ---\n{kvp.Value}"));
            if (!string.IsNullOrWhiteSpace(essayText))
            {
                writingSubmission = new WritingSubmission
                {
                    UserId = userId,
                    ExamId = attempt.ExamId,
                    AttemptId = attempt.AttemptId,
                    Prompt = "Mock Test Writing",
                    EssayText = essayText,
                    Status = "processing"
                };
                await _unitOfWork.WritingSubmissions.AddAsync(writingSubmission);
            }
        }

        // Process Speaking
        List<SpeakingSubmission> speakingSubmissions = new();
        if (payload?.Speaking?.Answers != null && payload.Speaking.Answers.Any())
        {
            foreach (var ans in payload.Speaking.Answers)
            {
                if (!string.IsNullOrWhiteSpace(ans.AudioUrl) || !string.IsNullOrWhiteSpace(ans.Transcript))
                {
                    var speakingSubmission = new SpeakingSubmission
                    {
                        UserId = userId,
                        ExamId = attempt.ExamId,
                        AttemptId = attempt.AttemptId,
                        PartNumber = ans.PartNumber,
                        AudioUrl = ans.AudioUrl ?? string.Empty,
                        Transcript = ans.Transcript ?? string.Empty,
                        Status = "processing"
                    };
                    speakingSubmissions.Add(speakingSubmission);
                    await _unitOfWork.SpeakingSubmissions.AddAsync(speakingSubmission);
                }
            }
        }

        attempt.Status = "completed";
        attempt.SubmittedAt = DateTime.UtcNow;
        attempt.CompletedAt = DateTime.UtcNow;
        attempt.TotalQuestions = questions.Count;
        attempt.CorrectCount = correctCount;
        attempt.Score = totalScore;
        attempt.DurationUsedSeconds = attempt.StartedAt > DateTime.UtcNow ? 0 : (int)(DateTime.UtcNow - attempt.StartedAt).TotalSeconds;

        _unitOfWork.ExamAttempts.Update(attempt);
        await _unitOfWork.SaveChangesAsync();

        // Trigger AI grading in background
        if (writingSubmission != null || speakingSubmissions.Any())
        {
            _ = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var aiGradingService = scope.ServiceProvider.GetRequiredService<IAIGradingService>();
                var backgroundUoW = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                if (writingSubmission != null)
                {
                    try
                    {
                        var scoreResult = await aiGradingService.GradeWritingAsync(userId, writingSubmission.WritingSubmissionId, writingSubmission.Prompt, writingSubmission.EssayText);
                        var wSub = await backgroundUoW.WritingSubmissions.GetByIdAsync(writingSubmission.WritingSubmissionId);
                        if (wSub != null)
                        {
                            wSub.Score = scoreResult.Score;
                            wSub.Feedback = scoreResult.Feedback;
                            wSub.FeedbackJson = scoreResult.FeedbackJson;
                            wSub.Status = "scored";
                            backgroundUoW.WritingSubmissions.Update(wSub);
                            await backgroundUoW.SaveChangesAsync();
                        }
                    }
                    catch (Exception)
                    {
                        var wSub = await backgroundUoW.WritingSubmissions.GetByIdAsync(writingSubmission.WritingSubmissionId);
                        if (wSub != null)
                        {
                            wSub.Status = "failed";
                            wSub.Feedback = "AI grading failed.";
                            backgroundUoW.WritingSubmissions.Update(wSub);
                            await backgroundUoW.SaveChangesAsync();
                        }
                    }
                }

                foreach (var sSub in speakingSubmissions)
                {
                    try
                    {
                        var scoreResult = await aiGradingService.GradeSpeakingAsync(userId, sSub.SpeakingSubmissionId, "Mock Test Speaking", sSub.Transcript, sSub.AudioUrl);
                        var s = await backgroundUoW.SpeakingSubmissions.GetByIdAsync(sSub.SpeakingSubmissionId);
                        if (s != null)
                        {
                            s.Score = scoreResult.Score;
                            s.Feedback = scoreResult.Feedback;
                            s.FeedbackJson = scoreResult.FeedbackJson;
                            s.Status = "scored";
                            backgroundUoW.SpeakingSubmissions.Update(s);
                            await backgroundUoW.SaveChangesAsync();
                        }
                    }
                    catch (Exception)
                    {
                        var s = await backgroundUoW.SpeakingSubmissions.GetByIdAsync(sSub.SpeakingSubmissionId);
                        if (s != null)
                        {
                            s.Status = "failed";
                            s.Feedback = "AI grading failed.";
                            backgroundUoW.SpeakingSubmissions.Update(s);
                            await backgroundUoW.SaveChangesAsync();
                        }
                    }
                }

                await backgroundUoW.SaveChangesAsync();
            });
        }

        return new SubmitPracticeResponse
        {
            AttemptId = attempt.AttemptId,
            Status = attempt.Status,
            Score = totalScore,
            TotalQuestions = questions.Count,
            CorrectCount = correctCount,
            SubmittedAt = attempt.SubmittedAt
        };
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

    private async Task<Exam> GetPublishedExamAsync(int examId, string expectedSkillType)
    {
        var exam = await _unitOfWork.Exams.GetDetailByIdAsync(examId);

        if (exam is null)
        {
            throw new KeyNotFoundException("Exam not found.");
        }

        if (expectedSkillType != "mock_test" && exam.SkillType != expectedSkillType)
        {
            throw new InvalidOperationException($"Exam is not a {expectedSkillType} practice exam.");
        }

        return exam;
    }

    private static bool IsAnswerCorrect(ExamQuestion question, string userAnswer)
    {
        var normalizedAnswer = NormalizeAnswer(userAnswer);
        var correctAnswer = NormalizeAnswer(question.CorrectAnswer);

        if (!string.IsNullOrWhiteSpace(correctAnswer) && normalizedAnswer == correctAnswer)
        {
            return true;
        }

        return question.Options.Any(option =>
            option.IsCorrect &&
            (NormalizeAnswer(option.Label) == normalizedAnswer || NormalizeAnswer(option.Content) == normalizedAnswer));
    }

    private static bool IsFreeUser(User user)
    {
        return user.SubscriptionPlanId == 1 || user.SubscriptionPlan.Name == "free";
    }

    private static string NormalizeAnswer(string answer)
    {
        return answer.Trim().ToLowerInvariant();
    }

    private static decimal? CalculateScoreOnTen(int correctCount, int totalQuestions)
    {
        return totalQuestions > 0
            ? decimal.Round((decimal)correctCount * 10 / totalQuestions, 2)
            : null;
    }

    private static ExamDetailResponse HideAnswers(ExamDetailResponse response)
    {
        if (response?.Sections != null)
        {
            foreach (var section in response.Sections)
            {
                foreach (var question in section.Questions)
                {
                    question.CorrectAnswer = string.Empty;
                    question.Explanation = null;

                    foreach (var option in question.Options)
                    {
                        option.IsCorrect = false;
                    }
                }
            }
        }

        return response;
    }
    private static string MergeDraftStateJson(string? existingJson, string? newJson)
    {
        if (string.IsNullOrEmpty(existingJson)) return newJson ?? string.Empty;
        if (string.IsNullOrEmpty(newJson)) return existingJson;

        try
        {
            var existingNode = System.Text.Json.Nodes.JsonNode.Parse(existingJson) as System.Text.Json.Nodes.JsonObject;
            var newNode = System.Text.Json.Nodes.JsonNode.Parse(newJson) as System.Text.Json.Nodes.JsonObject;

            if (existingNode != null && newNode != null)
            {
                foreach (var skillProp in newNode)
                {
                    var skillKey = skillProp.Key;

                    // Special handling for _meta: merge properties instead of replacing
                    if (skillKey == "_meta")
                    {
                        var existingMeta = existingNode["_meta"] as System.Text.Json.Nodes.JsonObject;
                        var newMeta = skillProp.Value as System.Text.Json.Nodes.JsonObject;

                        if (existingMeta != null && newMeta != null)
                        {
                            // Merge _meta properties: new values override existing, except selectedExamIds which is preserved
                            foreach (var metaProp in newMeta)
                            {
                                if (metaProp.Key != "selectedExamIds")
                                {
                                    existingMeta[metaProp.Key] = metaProp.Value?.DeepClone();
                                }
                            }
                        }
                        else if (newMeta != null)
                        {
                            existingNode["_meta"] = newMeta.DeepClone();
                        }
                        continue;
                    }

                    if (!existingNode.ContainsKey(skillKey) || existingNode[skillKey] == null || skillKey == "currentSkill" || skillKey == "clientUpdatedAt")
                    {
                        existingNode[skillKey] = skillProp.Value?.DeepClone();
                        continue;
                    }
                    
                    var existingSkillObj = existingNode[skillKey] as System.Text.Json.Nodes.JsonObject;
                    var newSkillObj = skillProp.Value as System.Text.Json.Nodes.JsonObject;
                    
                    if (existingSkillObj != null && newSkillObj != null)
                    {
                        if (skillKey == "writing")
                        {
                            foreach (var writingProp in newSkillObj)
                            {
                                existingSkillObj[writingProp.Key] = writingProp.Value?.DeepClone();
                            }
                        }
                        else
                        {
                            if (newSkillObj.ContainsKey("answers") && newSkillObj["answers"] != null)
                            {
                                if (!existingSkillObj.ContainsKey("answers") || existingSkillObj["answers"] == null)
                                {
                                    existingSkillObj["answers"] = newSkillObj["answers"]?.DeepClone();
                                }
                                else
                                {
                                    var existingAnswersObj = existingSkillObj["answers"] as System.Text.Json.Nodes.JsonObject;
                                    var newAnswersObj = newSkillObj["answers"] as System.Text.Json.Nodes.JsonObject;
                                    
                                    if (existingAnswersObj != null && newAnswersObj != null)
                                    {
                                        foreach (var ans in newAnswersObj)
                                        {
                                            existingAnswersObj[ans.Key] = ans.Value?.DeepClone();
                                        }
                                    }
                                    else if (existingSkillObj["answers"] is System.Text.Json.Nodes.JsonArray existingAnswersArr && 
                                             newSkillObj["answers"] is System.Text.Json.Nodes.JsonArray newAnswersArr)
                                    {
                                        foreach (var newItem in newAnswersArr)
                                        {
                                            if (newItem is System.Text.Json.Nodes.JsonObject newItemObj && newItemObj.ContainsKey("questionId"))
                                            {
                                                var qId = newItemObj["questionId"]?.GetValue<int>();
                                                var existingItem = existingAnswersArr.FirstOrDefault(x => x is System.Text.Json.Nodes.JsonObject o && o.ContainsKey("questionId") && o["questionId"]?.GetValue<int>() == qId);
                                                
                                                if (existingItem != null)
                                                {
                                                    var existingItemObj = existingItem as System.Text.Json.Nodes.JsonObject;
                                                    foreach (var prop in newItemObj)
                                                    {
                                                        existingItemObj[prop.Key] = prop.Value?.DeepClone();
                                                    }
                                                }
                                                else
                                                {
                                                    existingAnswersArr.Add(newItemObj.DeepClone());
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            foreach (var skillSubProp in newSkillObj)
                            {
                                if (skillSubProp.Key != "answers")
                                {
                                    existingSkillObj[skillSubProp.Key] = skillSubProp.Value?.DeepClone();
                                }
                            }
                        }
                    }
                    else
                    {
                        existingNode[skillKey] = skillProp.Value?.DeepClone();
                    }
                }
                return existingNode.ToJsonString();
            }
        }
        catch { }
        
        return newJson;
    }

    private async Task<bool> ExpireAndSubmitAttemptIfNeededAsync(int userId, ExamAttempt attempt)
    {
        if (attempt.Status == "in_progress" && attempt.ExpiresAt.HasValue && DateTime.UtcNow >= attempt.ExpiresAt.Value)
        {
            // Early status update to prevent concurrent auto-submits
            attempt.Status = "auto_submitting";
            _unitOfWork.ExamAttempts.Update(attempt);
            await _unitOfWork.SaveChangesAsync();

            await SubmitMockTestAsync(userId, attempt.AttemptId, new SubmitMockTestRequest());
            return true;
        }
        return false;
    }

    public async Task<StartRandomMockTestResponse> StartRandomMockTestAsync(int userId)
    {
        // 1. Fetch 4 random published exams (one for each skill, non-mock_test)
        var query = new DataAccessLayer.Core.Parameters.ExamQueryParameters { Page = 1, PageSize = 1000, IsPublished = true };
        var pagedExams = await _unitOfWork.Exams.GetPagedAsync(query);
        var allExams = pagedExams.Exams;
        var eligibleExams = allExams
            .Where(e => e.IsPublished && !e.IsDeleted && !(e.Description ?? "").Contains("mode:mock_test"))
            .ToList();

        // Separate by skill
        var listeningExams = eligibleExams.Where(e => e.SkillType == "listening").ToList();
        var readingExams = eligibleExams.Where(e => e.SkillType == "reading").ToList();
        var writingExams = eligibleExams.Where(e => e.SkillType == "writing").ToList();
        var speakingExams = eligibleExams.Where(e => e.SkillType == "speaking").ToList();

        if (!listeningExams.Any() || !readingExams.Any() || !writingExams.Any() || !speakingExams.Any())
        {
            throw new InvalidOperationException("Hiện chưa đủ đề published cho đủ 4 kỹ năng để tạo bài thi ngẫu nhiên.");
        }

        // 2. Fetch user's completed attempts to prioritize new exams
        var userHistory = await _unitOfWork.ExamAttempts.GetHistoryPagedAsync(userId, 1, 1000);
        var completedExamIds = new HashSet<int>();
        foreach (var a in userHistory.Items)
        {
            if (a.Status == "submitted" || a.Status == "scored" || a.Status == "completed")
            {
                completedExamIds.Add(a.ExamId);
                if (!string.IsNullOrEmpty(a.DraftStateJson))
                {
                    try
                    {
                        var node = System.Text.Json.Nodes.JsonNode.Parse(a.DraftStateJson);
                        var mode = node?["_meta"]?["mode"]?.ToString();
                        if (mode == "random_mock_test")
                        {
                            var selected = node?["_meta"]?["selectedExamIds"];
                            if (selected != null)
                            {
                                completedExamIds.Add(selected["listening"]?.GetValue<int>() ?? 0);
                                completedExamIds.Add(selected["reading"]?.GetValue<int>() ?? 0);
                                completedExamIds.Add(selected["writing"]?.GetValue<int>() ?? 0);
                                completedExamIds.Add(selected["speaking"]?.GetValue<int>() ?? 0);
                            }
                        }
                    }
                    catch { }
                }
            }
        }

        var random = new Random();
        int GetRandomExam(List<Exam> exams)
        {
            var uncompleted = exams.Where(e => !completedExamIds.Contains(e.ExamId)).ToList();
            if (uncompleted.Any()) return uncompleted[random.Next(uncompleted.Count)].ExamId;
            return exams[random.Next(exams.Count)].ExamId;
        }

        var listeningId = GetRandomExam(listeningExams);
        var readingId = GetRandomExam(readingExams);
        var writingId = GetRandomExam(writingExams);
        var speakingId = GetRandomExam(speakingExams);

        // 2. Create ExamAttempt
        var attempt = new ExamAttempt
        {
            UserId = userId,
            ExamId = listeningId, // Primary FK to satisfy DB
            SkillType = "mock_test",
            Status = "in_progress",
            StartedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(172),
            DurationMinutes = 172,
            CurrentSkill = "listening",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var selectedExamIds = new Dictionary<string, int>
        {
            { "listening", listeningId },
            { "reading", readingId },
            { "writing", writingId },
            { "speaking", speakingId }
        };

        var skillDurations = new Dictionary<string, int>
        {
            { "listening", 40 },
            { "reading", 60 },
            { "writing", 60 },
            { "speaking", 12 }
        };

        var draftMeta = new
        {
            _meta = new
            {
                mode = "random_mock_test",
                selectedExamIds,
                skillDurations
            }
        };

        attempt.DraftStateJson = System.Text.Json.JsonSerializer.Serialize(draftMeta);

        await _unitOfWork.ExamAttempts.AddAsync(attempt);
        await _unitOfWork.SaveChangesAsync();

        return new StartRandomMockTestResponse
        {
            AttemptId = attempt.AttemptId,
            Mode = "random_mock_test",
            SelectedExamIds = selectedExamIds,
            StartedAt = attempt.StartedAt,
            ExpiresAt = attempt.ExpiresAt,
            DurationMinutes = attempt.DurationMinutes ?? 180
        };
    }

    public async Task<HistoryPagedResponse> GetHistoryAsync(int userId, int page, int pageSize, string? status = null, string? mode = null)
    {
        var result = await _unitOfWork.ExamAttempts.GetHistoryPagedAsync(userId, page, pageSize, status, mode);

        var items = new List<HistoryItemResponse>();
        foreach (var attempt in result.Items)
        {
            var isRandom = attempt.DraftStateJson != null && attempt.DraftStateJson.Contains("\"mode\":\"random_mock_test\"");
            var actualMode = attempt.SkillType; // default to SkillType
            
            if (!string.IsNullOrEmpty(attempt.DraftStateJson))
            {
                try
                {
                    var node = System.Text.Json.Nodes.JsonNode.Parse(attempt.DraftStateJson);
                    var parsedMode = node?["_meta"]?["mode"]?.ToString();
                    if (!string.IsNullOrEmpty(parsedMode))
                    {
                        actualMode = parsedMode;
                    }
                }
                catch { }
            }

            var title = isRandom ? $"Random Mock Test - {attempt.StartedAt.ToLocalTime():dd/MM/yyyy}" : attempt.Exam?.Title ?? $"Attempt #{attempt.AttemptId}";
            
            var skillScores = new Dictionary<string, decimal?>();
            
            // Try to extract skill scores from Score or calculate it. 
            // Mock test doesn't save skill scores to DB columns cleanly, we may need a helper.
            // For now, if there is an Overall Score, we set it.
            
            items.Add(new HistoryItemResponse
            {
                AttemptId = attempt.AttemptId,
                Title = title,
                Mode = actualMode,
                Type = attempt.SkillType,
                Skills = attempt.SkillType == "mock_test" ? new List<string> { "listening", "reading", "writing", "speaking" } : new List<string> { attempt.SkillType },
                Status = attempt.Status,
                StartedAt = attempt.StartedAt,
                SubmittedAt = attempt.SubmittedAt,
                CompletedAt = attempt.CompletedAt,
                OverallScore = attempt.Score,
                SkillScores = skillScores, // Populating this might be expensive for list, leave empty or calculate basic
                CurrentSkill = attempt.CurrentSkill,
                RemainingSeconds = attempt.ExpiresAt.HasValue ? (int)Math.Max(0, (attempt.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds) : 0
            });
        }

        return new HistoryPagedResponse
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = result.TotalCount,
            TotalPages = (int)Math.Ceiling(result.TotalCount / (double)pageSize)
        };
    }

    private async Task<ExamDetailResponse> GetCompositeExamForAttemptAsync(ExamAttempt attempt, Exam originalExam, bool hideAnswers = true)
    {
        if (string.IsNullOrEmpty(attempt.DraftStateJson))
            return hideAnswers ? HideAnswers(_mapper.Map<ExamDetailResponse>(originalExam)) : _mapper.Map<ExamDetailResponse>(originalExam);

        try
        {
            var node = System.Text.Json.Nodes.JsonNode.Parse(attempt.DraftStateJson);
            var mode = node?["_meta"]?["mode"]?.ToString();

            // Handle both "random_mock_test" and "mock_test" modes (both use selectedExamIds)
            if (mode == "random_mock_test" || mode == "mock_test")
            {
                var selected = node?["_meta"]?["selectedExamIds"];
                if (selected != null)
                {
                    var listeningId = selected["listening"]?.GetValue<int>() ?? 0;
                    var readingId = selected["reading"]?.GetValue<int>() ?? 0;
                    var writingId = selected["writing"]?.GetValue<int>() ?? 0;
                    var speakingId = selected["speaking"]?.GetValue<int>() ?? 0;

                    var e1 = await _unitOfWork.Exams.GetDetailByIdAsync(listeningId);
                    var e2 = await _unitOfWork.Exams.GetDetailByIdAsync(readingId);
                    var e3 = await _unitOfWork.Exams.GetDetailByIdAsync(writingId);
                    var e4 = await _unitOfWork.Exams.GetDetailByIdAsync(speakingId);

                    var composite = new ExamDetailResponse
                    {
                        ExamId = originalExam.ExamId,
                        Title = $"Mock Test - {attempt.StartedAt.ToLocalTime():dd/MM/yyyy}",
                        SkillType = "mock_test",
                        IsPublished = true,
                        Sections = new List<SectionResponse>()
                    };

                    if (e1 != null)
                    {
                        var listening = e1.Sections.Select(s =>
                        {
                            var mapped = _mapper.Map<SectionResponse>(s);
                            mapped.SkillType = "listening";
                            return mapped;
                        });
                        composite.Sections.AddRange(listening);
                    }
                    if (e2 != null)
                    {
                        var reading = e2.Sections.Select(s =>
                        {
                            var mapped = _mapper.Map<SectionResponse>(s);
                            mapped.SkillType = "reading";
                            return mapped;
                        });
                        composite.Sections.AddRange(reading);
                    }
                    if (e3 != null)
                    {
                        var writing = e3.Sections.Select(s =>
                        {
                            var mapped = _mapper.Map<SectionResponse>(s);
                            mapped.SkillType = "writing";
                            return mapped;
                        });
                        composite.Sections.AddRange(writing);
                    }
                    if (e4 != null)
                    {
                        var speaking = e4.Sections.Select(s =>
                        {
                            var mapped = _mapper.Map<SectionResponse>(s);
                            mapped.SkillType = "speaking";
                            return mapped;
                        });
                        composite.Sections.AddRange(speaking);
                    }

                    return hideAnswers ? HideAnswers(composite) : composite;
                }
            }
        }
        catch { }

        var fallbackExam = _mapper.Map<ExamDetailResponse>(originalExam);
        if (fallbackExam?.Sections == null)
        {
            fallbackExam.Sections = new List<SectionResponse>();
        }
        return hideAnswers ? HideAnswers(fallbackExam) : fallbackExam;
    }

    public async Task DeleteAttemptAsync(int userId, int attemptId)
    {
        var attempt = await _unitOfWork.ExamAttempts.GetByIdAsync(attemptId);
        if (attempt == null || attempt.IsDeleted)
        {
            throw new KeyNotFoundException($"Attempt with ID {attemptId} not found or already deleted.");
        }

        if (attempt.UserId != userId)
        {
            throw new UnauthorizedAccessException("You do not have permission to delete this attempt.");
        }

        attempt.IsDeleted = true;
        attempt.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.ExamAttempts.Update(attempt);
        await _unitOfWork.SaveChangesAsync();
    }

    private static Dictionary<string, int>? ExtractSkillDurations(string? draftStateJson)
    {
        if (string.IsNullOrEmpty(draftStateJson))
            return null;

        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(draftStateJson);
            if (doc.RootElement.TryGetProperty("_meta", out var metaElement) &&
                metaElement.TryGetProperty("skillDurations", out var durationsElement))
            {
                var durations = new Dictionary<string, int>();
                foreach (var prop in durationsElement.EnumerateObject())
                {
                    if (prop.Value.TryGetInt32(out var minutes))
                    {
                        durations[prop.Name] = minutes;
                    }
                }
                return durations.Count > 0 ? durations : null;
            }
        }
        catch
        {
            // Ignore parsing errors
        }

        return null;
    }
}
