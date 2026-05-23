using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.Services.Interfaces;
using DataAccessLayer.Entities;
using DataAccessLayer.UoW;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace BusinessLogicLayer.Services.Implements;

public class ReadingExamImportService : IReadingExamImportService
{
    private static readonly Regex DurationRegex = new(@"Time\s+permitted\s*:\s*(\d+)\s*minutes?", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex PassageRegex = new(@"^\s*PASSAGE\s+(\d+)\b.*$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex QuestionRegex = new(@"^\s*(\d{1,3})\s*[\.\)]\s+(.+)$", RegexOptions.Compiled);
    private static readonly Regex OptionRegex = new(@"^\s*([A-Da-d])\s*[\.\)]\s+(.+)$", RegexOptions.Compiled);
    private static readonly Regex AnswerRegex = new(@"(?:^|\s)(\d{1,3})\s*[\.\):\-]\s*([A-Da-d])\b", RegexOptions.Compiled);
    private static readonly string[] ExpectedOptionLabels = ["A", "B", "C", "D"];

    private readonly IUnitOfWork _unitOfWork;

    public ReadingExamImportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ImportReadingExamResponse> ImportAsync(Stream docxStream, string fileName, bool isPublished)
    {
        if (docxStream.CanSeek && docxStream.Length == 0)
        {
            throw new InvalidOperationException("File is empty.");
        }

        if (!string.Equals(Path.GetExtension(fileName), ".docx", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only .docx files are supported.");
        }

        var lines = ReadParagraphLines(docxStream);
        if (lines.Count == 0)
        {
            throw new InvalidOperationException("The DOCX file does not contain readable text.");
        }

        var answerKeyIndex = lines.FindIndex(IsAnswerKeyHeader);
        var contentLines = answerKeyIndex >= 0 ? lines.Take(answerKeyIndex).ToList() : lines;
        var answerLines = answerKeyIndex >= 0 ? lines.Skip(answerKeyIndex + 1).ToList() : new List<string>();
        var answerKey = ParseAnswerKey(answerLines);

        var title = contentLines.FirstOrDefault(line => !IsMetadataLine(line) && !PassageRegex.IsMatch(line)) ?? "Reading Exam";
        var durationMinutes = ParseDurationMinutes(contentLines);
        var warnings = new List<ImportReadingWarningResponse>();
        var sections = ParseSections(contentLines, answerKey, warnings);

        if (sections.Count == 0)
        {
            throw new InvalidOperationException("No passage found in the reading DOCX file.");
        }

        var totalQuestions = sections.Sum(section => section.Questions.Count);
        if (totalQuestions == 0)
        {
            throw new InvalidOperationException("No questions found in the reading DOCX file.");
        }

        var exam = new Exam
        {
            Title = title.Trim(),
            SkillType = "reading",
            Description = "Imported from DOCX",
            DurationMinutes = durationMinutes,
            IsPublished = isPublished,
            Sections = sections
        };

        await _unitOfWork.Exams.AddAsync(exam);
        await _unitOfWork.SaveChangesAsync();

        return new ImportReadingExamResponse
        {
            ExamId = exam.ExamId,
            Title = exam.Title,
            TotalSections = exam.Sections.Count,
            TotalQuestions = totalQuestions,
            Warnings = warnings
        };
    }

    private static List<string> ReadParagraphLines(Stream docxStream)
    {
        using var document = WordprocessingDocument.Open(docxStream, false);
        var body = document.MainDocumentPart?.Document?.Body;
        if (body is null)
        {
            return new List<string>();
        }

        return body.Descendants<Paragraph>()
            .Select(paragraph => NormalizeWhitespace(paragraph.InnerText))
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();
    }

    private static int ParseDurationMinutes(IEnumerable<string> lines)
    {
        foreach (var line in lines)
        {
            var match = DurationRegex.Match(line);
            if (match.Success && int.TryParse(match.Groups[1].Value, out var durationMinutes) && durationMinutes > 0)
            {
                return durationMinutes;
            }
        }

        return 60;
    }

    private static Dictionary<int, string> ParseAnswerKey(IEnumerable<string> answerLines)
    {
        var answers = new Dictionary<int, string>();

        foreach (var line in answerLines)
        {
            foreach (Match match in AnswerRegex.Matches(line))
            {
                if (int.TryParse(match.Groups[1].Value, out var questionNumber))
                {
                    answers[questionNumber] = match.Groups[2].Value.ToUpperInvariant();
                }
            }
        }

        return answers;
    }

    private static List<ExamSection> ParseSections(
        List<string> contentLines,
        IReadOnlyDictionary<int, string> answerKey,
        List<ImportReadingWarningResponse> warnings)
    {
        var passageIndexes = contentLines
            .Select((line, index) => new { Line = line, Index = index, Match = PassageRegex.Match(line) })
            .Where(item => item.Match.Success)
            .ToList();

        var sections = new List<ExamSection>();

        for (var i = 0; i < passageIndexes.Count; i++)
        {
            var passage = passageIndexes[i];
            var nextIndex = i + 1 < passageIndexes.Count ? passageIndexes[i + 1].Index : contentLines.Count;
            var sectionLines = contentLines
                .Skip(passage.Index + 1)
                .Take(nextIndex - passage.Index - 1)
                .ToList();

            var sectionNumber = int.Parse(passage.Match.Groups[1].Value);
            var firstQuestionIndex = sectionLines.FindIndex(line => QuestionRegex.IsMatch(line));
            var passageTextLines = firstQuestionIndex >= 0 ? sectionLines.Take(firstQuestionIndex).ToList() : sectionLines;
            var questionLines = firstQuestionIndex >= 0 ? sectionLines.Skip(firstQuestionIndex).ToList() : new List<string>();

            var section = new ExamSection
            {
                Title = $"PASSAGE {sectionNumber}",
                Instruction = passage.Line.Trim(),
                PassageText = JoinLines(passageTextLines),
                DisplayOrder = sectionNumber,
                Questions = ParseQuestions(questionLines, answerKey, sectionNumber, warnings)
            };

            sections.Add(section);
        }

        return sections;
    }

    private static List<ExamQuestion> ParseQuestions(
        List<string> lines,
        IReadOnlyDictionary<int, string> answerKey,
        int sectionNumber,
        List<ImportReadingWarningResponse> warnings)
    {
        var questions = new List<ParsedQuestion>();
        ParsedQuestion? currentQuestion = null;
        ParsedOption? currentOption = null;

        foreach (var line in lines)
        {
            var questionMatch = QuestionRegex.Match(line);
            if (questionMatch.Success)
            {
                FlushOption(currentQuestion, ref currentOption);
                FlushQuestion(questions, ref currentQuestion);

                currentQuestion = new ParsedQuestion
                {
                    Number = int.Parse(questionMatch.Groups[1].Value)
                };
                currentQuestion.QuestionTextLines.Add(questionMatch.Groups[2].Value.Trim());
                continue;
            }

            var optionMatch = OptionRegex.Match(line);
            if (optionMatch.Success && currentQuestion is not null)
            {
                FlushOption(currentQuestion, ref currentOption);
                currentOption = new ParsedOption
                {
                    Label = optionMatch.Groups[1].Value.ToUpperInvariant()
                };
                currentOption.ContentLines.Add(optionMatch.Groups[2].Value.Trim());
                continue;
            }

            if (currentOption is not null)
            {
                currentOption.ContentLines.Add(line.Trim());
            }
            else if (currentQuestion is not null)
            {
                currentQuestion.QuestionTextLines.Add(line.Trim());
            }
        }

        FlushOption(currentQuestion, ref currentOption);
        FlushQuestion(questions, ref currentQuestion);

        return questions.Select(question => ToExamQuestion(question, answerKey, sectionNumber, warnings)).ToList();
    }

    private static ExamQuestion ToExamQuestion(
        ParsedQuestion parsedQuestion,
        IReadOnlyDictionary<int, string> answerKey,
        int sectionNumber,
        List<ImportReadingWarningResponse> warnings)
    {
        var correctAnswer = answerKey.TryGetValue(parsedQuestion.Number, out var answer) ? answer : string.Empty;
        if (string.IsNullOrWhiteSpace(correctAnswer))
        {
            warnings.Add(new ImportReadingWarningResponse
            {
                Code = "MissingAnswerKey",
                Message = $"Question {parsedQuestion.Number} does not have an answer key.",
                QuestionNumber = parsedQuestion.Number,
                SectionNumber = sectionNumber
            });
        }

        var existingLabels = parsedQuestion.Options.Select(option => option.Label).ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var expectedLabel in ExpectedOptionLabels.Where(label => !existingLabels.Contains(label)))
        {
            warnings.Add(new ImportReadingWarningResponse
            {
                Code = "MissingOption",
                Message = $"Question {parsedQuestion.Number} is missing option {expectedLabel}.",
                QuestionNumber = parsedQuestion.Number,
                SectionNumber = sectionNumber
            });
        }

        return new ExamQuestion
        {
            QuestionText = JoinLines(parsedQuestion.QuestionTextLines),
            QuestionType = "multiple_choice",
            CorrectAnswer = correctAnswer,
            Score = 1,
            DisplayOrder = parsedQuestion.Number,
            Options = parsedQuestion.Options.Select((option, index) => new ExamOption
            {
                Label = option.Label,
                Content = JoinLines(option.ContentLines),
                IsCorrect = !string.IsNullOrWhiteSpace(correctAnswer) &&
                    string.Equals(option.Label, correctAnswer, StringComparison.OrdinalIgnoreCase),
                DisplayOrder = index + 1
            }).ToList()
        };
    }

    private static void FlushQuestion(List<ParsedQuestion> questions, ref ParsedQuestion? currentQuestion)
    {
        if (currentQuestion is not null)
        {
            questions.Add(currentQuestion);
            currentQuestion = null;
        }
    }

    private static void FlushOption(ParsedQuestion? currentQuestion, ref ParsedOption? currentOption)
    {
        if (currentQuestion is not null && currentOption is not null)
        {
            currentQuestion.Options.Add(currentOption);
            currentOption = null;
        }
    }

    private static bool IsMetadataLine(string line)
    {
        return DurationRegex.IsMatch(line) ||
            line.StartsWith("Number of questions", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAnswerKeyHeader(string line)
    {
        var normalized = RemoveDiacritics(line).ToUpperInvariant();
        return normalized.Contains("DAP AN", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("ANSWER KEY", StringComparison.OrdinalIgnoreCase);
    }

    private static string JoinLines(IEnumerable<string> lines)
    {
        return string.Join(Environment.NewLine, lines.Where(line => !string.IsNullOrWhiteSpace(line)).Select(line => line.Trim()));
    }

    private static string NormalizeWhitespace(string value)
    {
        return Regex.Replace(value, @"\s+", " ").Trim();
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC).Replace('Đ', 'D').Replace('đ', 'd');
    }

    private sealed class ParsedQuestion
    {
        public int Number { get; set; }

        public List<string> QuestionTextLines { get; } = new();

        public List<ParsedOption> Options { get; } = new();
    }

    private sealed class ParsedOption
    {
        public string Label { get; set; } = string.Empty;

        public List<string> ContentLines { get; } = new();
    }
}
