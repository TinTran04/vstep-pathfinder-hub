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
    private static readonly Regex QuestionRegex = new(@"^\s*(\d{1,3})\s*[\.\)]\s*(.+)$", RegexOptions.Compiled);
    private static readonly Regex OptionMarkerRegex = new(@"([A-Da-d])[\.\)]\s*", RegexOptions.Compiled);
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

        var lines = new List<string>();

        foreach (var element in body.ChildElements)
        {
            if (element is Paragraph paragraph)
            {
                AddLine(lines, paragraph.InnerText);
                continue;
            }

            if (element is Table table)
            {
                foreach (var row in table.Elements<TableRow>())
                {
                    var cells = row.Elements<TableCell>()
                        .Select(cell => NormalizeWhitespace(cell.InnerText))
                        .Where(cell => !string.IsNullOrWhiteSpace(cell))
                        .ToList();

                    if (cells.Count > 0)
                    {
                        lines.Add(string.Join('\t', cells));
                    }
                }
            }
        }

        return lines;
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
            var cells = line.Split('\t', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (cells.Length >= 2)
            {
                for (var i = 0; i + 1 < cells.Length; i += 2)
                {
                    AddAnswer(answers, cells[i], cells[i + 1]);
                }

                continue;
            }

            foreach (Match match in AnswerRegex.Matches(line))
            {
                AddAnswer(answers, match.Groups[1].Value, match.Groups[2].Value);
            }
        }

        return answers;
    }

    private static void AddAnswer(Dictionary<int, string> answers, string questionNumberText, string answerText)
    {
        if (!int.TryParse(questionNumberText.Trim(), out var questionNumber))
        {
            return;
        }

        var answer = answerText.Trim().ToUpperInvariant();
        if (answer.Length == 1 && answer[0] is >= 'A' and <= 'D')
        {
            answers[questionNumber] = answer;
        }
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
        string? currentOptionLabel = null;

        foreach (var line in lines)
        {
            var questionMatch = QuestionRegex.Match(line);
            if (questionMatch.Success)
            {
                FlushQuestion(questions, ref currentQuestion);

                currentQuestion = new ParsedQuestion
                {
                    Number = int.Parse(questionMatch.Groups[1].Value)
                };

                AddQuestionTextAndOptions(currentQuestion, questionMatch.Groups[2].Value.Trim(), ref currentOptionLabel, warnings, sectionNumber);
                continue;
            }

            if (currentQuestion is not null)
            {
                var optionSegments = SplitOptionSegments(line);
                if (optionSegments.Count > 0)
                {
                    foreach (var segment in optionSegments)
                    {
                        AddOrMergeOption(currentQuestion, segment.Label, segment.Content, warnings, sectionNumber);
                        currentOptionLabel = segment.Label;
                    }

                    continue;
                }

                if (!string.IsNullOrWhiteSpace(currentOptionLabel) &&
                    currentQuestion.Options.TryGetValue(currentOptionLabel, out var currentOption))
                {
                    currentOption.ContentLines.Add(line.Trim());
                    continue;
                }

                currentQuestion.QuestionTextLines.Add(line.Trim());
            }
        }

        FlushQuestion(questions, ref currentQuestion);

        return questions.Select(question => ToExamQuestion(question, answerKey, sectionNumber, warnings)).ToList();
    }

    private static void AddQuestionTextAndOptions(
        ParsedQuestion question,
        string text,
        ref string? currentOptionLabel,
        List<ImportReadingWarningResponse> warnings,
        int sectionNumber)
    {
        var optionSegments = SplitOptionSegments(text);
        if (optionSegments.Count == 0)
        {
            question.QuestionTextLines.Add(text);
            currentOptionLabel = null;
            return;
        }

        var questionText = text[..optionSegments[0].StartIndex].Trim();
        if (!string.IsNullOrWhiteSpace(questionText))
        {
            question.QuestionTextLines.Add(questionText);
        }

        foreach (var segment in optionSegments)
        {
            AddOrMergeOption(question, segment.Label, segment.Content, warnings, sectionNumber);
            currentOptionLabel = segment.Label;
        }
    }

    private static List<OptionSegment> SplitOptionSegments(string line)
    {
        var markerMatches = OptionMarkerRegex.Matches(line)
            .Where(match => IsValidOptionMarker(line, match))
            .ToList();

        if (markerMatches.Count == 0)
        {
            return new List<OptionSegment>();
        }

        var segments = new List<OptionSegment>();
        for (var i = 0; i < markerMatches.Count; i++)
        {
            var marker = markerMatches[i];
            var contentStart = marker.Index + marker.Length;
            var contentEnd = i + 1 < markerMatches.Count ? markerMatches[i + 1].Index : line.Length;
            var content = line[contentStart..contentEnd].Trim();

            segments.Add(new OptionSegment(
                marker.Groups[1].Value.ToUpperInvariant(),
                content,
                marker.Index));
        }

        return segments;
    }

    private static bool IsValidOptionMarker(string line, Match marker)
    {
        var label = marker.Groups[1].Value[0];
        var markerIndex = marker.Index;

        if (markerIndex == 0)
        {
            return true;
        }

        var previous = line[markerIndex - 1];

        if (char.IsWhiteSpace(previous) || previous is '.' or ';' or ':' or '!' or '?' or ')' or ']' or '}')
        {
            return true;
        }

        // Word often flattens "A. text B. text" into "A.textB.text"; allow uppercase markers after content.
        return char.IsUpper(label) && (char.IsLower(previous) || char.IsDigit(previous));
    }

    private static void AddOrMergeOption(
        ParsedQuestion question,
        string label,
        string content,
        List<ImportReadingWarningResponse> warnings,
        int sectionNumber)
    {
        if (!question.Options.TryGetValue(label, out var option))
        {
            option = new ParsedOption
            {
                Label = label
            };
            question.Options[label] = option;
        }
        else
        {
            warnings.Add(new ImportReadingWarningResponse
            {
                Code = "DuplicateOption",
                Message = $"Question {question.Number} has duplicate option {label}; duplicated content was merged.",
                QuestionNumber = question.Number,
                SectionNumber = sectionNumber
            });
        }

        if (!string.IsNullOrWhiteSpace(content))
        {
            option.ContentLines.Add(content.Trim());
        }
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

        var options = parsedQuestion.Options.Values
            .GroupBy(option => option.Label, StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                var merged = new ParsedOption
                {
                    Label = group.Key.ToUpperInvariant()
                };

                foreach (var option in group)
                {
                    merged.ContentLines.AddRange(option.ContentLines);
                }

                if (group.Count() > 1)
                {
                    warnings.Add(new ImportReadingWarningResponse
                    {
                        Code = "DuplicateOption",
                        Message = $"Question {parsedQuestion.Number} has duplicate option {group.Key}; duplicated content was merged.",
                        QuestionNumber = parsedQuestion.Number,
                        SectionNumber = sectionNumber
                    });
                }

                return merged;
            })
            .OrderBy(option => GetOptionDisplayOrder(option.Label))
            .ToList();

        var existingLabels = options.Select(option => option.Label).ToHashSet(StringComparer.OrdinalIgnoreCase);
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
            Options = options.Select(option => new ExamOption
            {
                Label = option.Label,
                Content = JoinLines(option.ContentLines),
                IsCorrect = !string.IsNullOrWhiteSpace(correctAnswer) &&
                    string.Equals(option.Label, correctAnswer, StringComparison.OrdinalIgnoreCase),
                DisplayOrder = GetOptionDisplayOrder(option.Label)
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

    private static void AddLine(List<string> lines, string value)
    {
        var line = NormalizeWhitespace(value);
        if (!string.IsNullOrWhiteSpace(line))
        {
            lines.Add(line);
        }
    }

    private static int GetOptionDisplayOrder(string label)
    {
        return label.ToUpperInvariant() switch
        {
            "A" => 1,
            "B" => 2,
            "C" => 3,
            "D" => 4,
            _ => 99
        };
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

        return builder.ToString()
            .Normalize(NormalizationForm.FormC)
            .Replace("\u0110", "D")
            .Replace("\u0111", "d");
    }

    private sealed class ParsedQuestion
    {
        public int Number { get; set; }

        public List<string> QuestionTextLines { get; } = new();

        public Dictionary<string, ParsedOption> Options { get; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private sealed class ParsedOption
    {
        public string Label { get; set; } = string.Empty;

        public List<string> ContentLines { get; } = new();
    }

    private sealed record OptionSegment(string Label, string Content, int StartIndex);
}
