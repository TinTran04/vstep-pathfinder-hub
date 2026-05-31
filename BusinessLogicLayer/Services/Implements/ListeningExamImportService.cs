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

public class ListeningExamImportService : IListeningExamImportService
{
    private static readonly Regex DurationRegex = new(@"Time\s+permitted\s*:\s*(\d+)\s*minutes?", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex PassageRegex = new(@"^\s*PASSAGE\s+(\d+)\b.*$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex ListeningPartRegex = new(@"\bPART\s*([1-3])\.?", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex AnswerRegex = new(@"(?:^|\s)(\d{1,3})\s*[\.\):\-]\s*([A-Da-d])\b", RegexOptions.Compiled);
    private static readonly Regex CompactAnswerRegex = new(@"(?<!\d)(\d{1,3})\s*([A-Da-d])(?![A-Za-z])", RegexOptions.Compiled);
    private static readonly Regex ListeningIntroRegex = new(@"\s+(Conversation\s+\d+\.|Talk/Lecture\s+\d+\.).*$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly string[] ExpectedOptionLabels = ["A", "B", "C", "D"];

    private readonly IUnitOfWork _unitOfWork;

    public ListeningExamImportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ImportListeningExamResponse> ImportAsync(Stream docxStream, string fileName, string? audioUrl, bool isPublished)
    {
        if (docxStream.CanSeek && docxStream.Length == 0)
        {
            throw new InvalidOperationException("File is empty.");
        }

        if (!string.Equals(Path.GetExtension(fileName), ".docx", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only .docx files are supported.");
        }

        var lines = ReadDocumentLines(docxStream);
        if (lines.Count == 0)
        {
            throw new InvalidOperationException("The DOCX file does not contain readable text.");
        }

        var answerKeyIndex = lines.FindIndex(IsListeningAnswerKeyLine);
        if (answerKeyIndex < 0)
        {
            answerKeyIndex = lines.FindIndex(IsAnswerKeyHeader);
        }

        var contentLines = answerKeyIndex >= 0 ? lines.Take(answerKeyIndex).ToList() : lines;
        var answerLines = answerKeyIndex >= 0 ? lines.Skip(answerKeyIndex).ToList() : new List<string>();
        var answerKey = ParseAnswerKey(answerLines);

        var title = contentLines.FirstOrDefault(line => !IsMetadataLine(line) && !PassageRegex.IsMatch(line)) ?? "Listening Exam";
        var durationMinutes = ParseDurationMinutes(contentLines);
        var warnings = new List<ImportReadingWarningResponse>();
        var sections = ParseListeningSections(contentLines, answerKey, warnings);
        var normalizedAudioUrl = NormalizeNullable(audioUrl);

        if (sections.Count == 0)
        {
            throw new InvalidOperationException("No part found in the listening DOCX file.");
        }

        var totalQuestions = sections.Sum(section => section.Questions.Count);
        if (totalQuestions == 0)
        {
            throw new InvalidOperationException("No questions found in the listening DOCX file.");
        }

        foreach (var section in sections.Where(section => string.IsNullOrWhiteSpace(section.AudioUrl)))
        {
            section.AudioUrl = normalizedAudioUrl;
        }

        var exam = new Exam
        {
            Title = title.Trim(),
            SkillType = "listening",
            Description = "Imported from DOCX",
            DurationMinutes = durationMinutes,
            AudioUrl = normalizedAudioUrl,
            IsPublished = isPublished,
            Sections = sections
        };

        await _unitOfWork.Exams.AddAsync(exam);
        await _unitOfWork.SaveChangesAsync();

        return new ImportListeningExamResponse
        {
            ExamId = exam.ExamId,
            Title = exam.Title,
            AudioUrl = exam.AudioUrl,
            TotalSections = exam.Sections.Count,
            TotalQuestions = totalQuestions,
            Warnings = warnings
        };
    }

    private static List<string> ReadDocumentLines(Stream docxStream)
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

            foreach (Match match in CompactAnswerRegex.Matches(line))
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

    private static List<ExamSection> ParseListeningSections(
        List<string> contentLines,
        IReadOnlyDictionary<int, string> answerKey,
        List<ImportReadingWarningResponse> warnings)
    {
        var content = NormalizeWhitespace(string.Join(' ', contentLines));
        var partMatches = ListeningPartRegex.Matches(content).ToList();
        var sections = new List<ExamSection>();

        for (var i = 0; i < partMatches.Count; i++)
        {
            var partMatch = partMatches[i];
            var nextPartIndex = i + 1 < partMatches.Count ? partMatches[i + 1].Index : content.Length;
            var partText = content[partMatch.Index..nextPartIndex].Trim();
            var partNumber = int.Parse(partMatch.Groups[1].Value);
            var (firstQuestionNumber, lastQuestionNumber) = GetListeningQuestionRange(partNumber);

            if (firstQuestionNumber == 0)
            {
                continue;
            }

            var questionMarkers = FindListeningQuestionMarkers(partText, firstQuestionNumber, lastQuestionNumber);
            if (questionMarkers.Count == 0)
            {
                warnings.Add(new ImportReadingWarningResponse
                {
                    Code = "MissingQuestions",
                    Message = $"Part {partNumber} does not contain questions {firstQuestionNumber}-{lastQuestionNumber}.",
                    SectionNumber = partNumber
                });
                continue;
            }

            var instruction = partText[..questionMarkers[0].MarkerIndex].Trim();
            var questions = new List<ExamQuestion>();

            for (var questionIndex = 0; questionIndex < questionMarkers.Count; questionIndex++)
            {
                var marker = questionMarkers[questionIndex];
                var questionStart = marker.ContentStartIndex;
                var questionEnd = questionIndex + 1 < questionMarkers.Count
                    ? questionMarkers[questionIndex + 1].MarkerIndex
                    : partText.Length;
                var questionBody = partText[questionStart..questionEnd].Trim();
                questions.Add(ParseListeningQuestion(marker.Number, questionBody, answerKey, partNumber, warnings));
            }

            sections.Add(new ExamSection
            {
                Title = $"PART {partNumber}",
                Instruction = instruction,
                PassageText = instruction,
                DisplayOrder = partNumber,
                Questions = questions
            });
        }

        return sections;
    }

    private static List<ListeningQuestionMarker> FindListeningQuestionMarkers(
        string partText,
        int firstQuestionNumber,
        int lastQuestionNumber)
    {
        var markers = new List<ListeningQuestionMarker>();
        var searchStartIndex = 0;

        for (var questionNumber = firstQuestionNumber; questionNumber <= lastQuestionNumber; questionNumber++)
        {
            var marker = FindListeningQuestionMarker(partText, questionNumber, searchStartIndex);
            if (marker is null && questionNumber == 1)
            {
                marker = FindListeningQuestionMarker(partText, 11, searchStartIndex, normalizedQuestionNumber: 1);
            }

            if (marker is null)
            {
                continue;
            }

            markers.Add(marker);
            searchStartIndex = marker.ContentStartIndex;
        }

        return markers;
    }

    private static ListeningQuestionMarker? FindListeningQuestionMarker(
        string partText,
        int markerNumber,
        int startIndex,
        int? normalizedQuestionNumber = null)
    {
        var regex = new Regex($@"{markerNumber}\s*[\.,\)]\s*", RegexOptions.Compiled);
        var match = regex.Match(partText, startIndex);
        if (!match.Success)
        {
            return null;
        }

        return new ListeningQuestionMarker(
            normalizedQuestionNumber ?? markerNumber,
            match.Index,
            match.Index + match.Length);
    }

    private static (int FirstQuestionNumber, int LastQuestionNumber) GetListeningQuestionRange(int partNumber)
    {
        return partNumber switch
        {
            1 => (1, 8),
            2 => (9, 20),
            3 => (21, 35),
            _ => (0, 0)
        };
    }

    private static ExamQuestion ParseListeningQuestion(
        int questionNumber,
        string questionBody,
        IReadOnlyDictionary<int, string> answerKey,
        int sectionNumber,
        List<ImportReadingWarningResponse> warnings)
    {
        var parsedQuestion = new ParsedQuestion
        {
            Number = questionNumber
        };

        var optionSegments = SplitListeningOptionSegments(questionBody);
        if (optionSegments.Count == 0)
        {
            parsedQuestion.QuestionTextLines.Add(questionBody);
            warnings.Add(new ImportReadingWarningResponse
            {
                Code = "MissingOptions",
                Message = $"Question {questionNumber} does not contain recognizable options.",
                QuestionNumber = questionNumber,
                SectionNumber = sectionNumber
            });

            return ToExamQuestion(parsedQuestion, answerKey, sectionNumber, warnings);
        }

        var questionText = questionBody[..optionSegments[0].StartIndex].Trim();
        parsedQuestion.QuestionTextLines.Add(questionText);

        foreach (var segment in optionSegments)
        {
            AddOrMergeOption(parsedQuestion, segment.Label, CleanListeningOptionContent(segment.Content), warnings, sectionNumber);
        }

        return ToExamQuestion(parsedQuestion, answerKey, sectionNumber, warnings);
    }

    private static List<OptionSegment> SplitListeningOptionSegments(string text)
    {
        var markerMatches = FindListeningOptionMarkers(text);
        if (markerMatches.Count == 0)
        {
            return new List<OptionSegment>();
        }

        var segments = new List<OptionSegment>();
        for (var i = 0; i < markerMatches.Count; i++)
        {
            var marker = markerMatches[i];
            var contentStart = marker.ContentStartIndex;
            var contentEnd = i + 1 < markerMatches.Count ? markerMatches[i + 1].MarkerIndex : text.Length;
            var content = text[contentStart..contentEnd].Trim();
            segments.Add(new OptionSegment(marker.Label, content, marker.MarkerIndex));
        }

        return segments;
    }

    private static List<ListeningOptionMarker> FindListeningOptionMarkers(string text)
    {
        var markers = new List<ListeningOptionMarker>();

        for (var i = 0; i < text.Length; i++)
        {
            var character = text[i];
            if (!IsOptionLabel(character))
            {
                continue;
            }

            var nextIndex = i + 1;
            while (nextIndex < text.Length && char.IsWhiteSpace(text[nextIndex]))
            {
                nextIndex++;
            }

            if (nextIndex >= text.Length)
            {
                continue;
            }

            var previous = i == 0 ? '\0' : text[i - 1];
            var hasMarkerPunctuation = text[nextIndex] is '.' or ',' or ')';
            if (i > 0 &&
                !char.IsWhiteSpace(previous) &&
                previous is not '_' and not '.' and not '?' and not '!' and not ':' and not ';' &&
                !(char.IsLower(previous) && char.IsUpper(character) && hasMarkerPunctuation))
            {
                continue;
            }

            var contentStartIndex = -1;
            if (hasMarkerPunctuation)
            {
                contentStartIndex = nextIndex + 1;
            }
            else if (char.IsUpper(character) &&
                !char.IsWhiteSpace(text[nextIndex]) &&
                HasNearbyNextOptionMarker(text, i))
            {
                contentStartIndex = i + 1;
            }

            if (contentStartIndex < 0)
            {
                continue;
            }

            while (contentStartIndex < text.Length && char.IsWhiteSpace(text[contentStartIndex]))
            {
                contentStartIndex++;
            }

            markers.Add(new ListeningOptionMarker(character.ToString().ToUpperInvariant(), i, contentStartIndex));
        }

        return markers
            .GroupBy(marker => marker.Label, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .OrderBy(marker => marker.MarkerIndex)
            .ToList();
    }

    private static bool HasNearbyNextOptionMarker(string text, int markerIndex)
    {
        for (var i = markerIndex + 1; i < Math.Min(text.Length, markerIndex + 40); i++)
        {
            if (char.ToUpperInvariant(text[i]) is not ('B' or 'C' or 'D'))
            {
                continue;
            }

            var previous = i == 0 ? '\0' : text[i - 1];
            var next = i + 1 < text.Length ? text[i + 1] : '\0';
            if ((char.IsWhiteSpace(previous) || previous is '.' or '?' or '!' or ':' or ';' or '_') &&
                (next is '.' or ',' or ')' || char.IsWhiteSpace(next)))
            {
                return true;
            }
        }

        return false;
    }

    private static string CleanListeningOptionContent(string content)
    {
        var cleaned = ListeningIntroRegex.Replace(content, string.Empty);
        return cleaned.Trim().TrimStart('_').Trim();
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

    private static bool IsListeningAnswerKeyLine(string line)
    {
        var normalized = RemoveDiacritics(line).ToUpperInvariant();
        var compactAnswerCount = CompactAnswerRegex.Matches(normalized).Count;
        return normalized.StartsWith("LISTENING", StringComparison.OrdinalIgnoreCase) && compactAnswerCount >= 3;
    }

    private static string JoinLines(IEnumerable<string> lines)
    {
        return string.Join(Environment.NewLine, lines.Where(line => !string.IsNullOrWhiteSpace(line)).Select(line => line.Trim()));
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
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

    private static bool IsOptionLabel(char character)
    {
        return char.ToUpperInvariant(character) is 'A' or 'B' or 'C' or 'D';
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

    private sealed record ListeningQuestionMarker(int Number, int MarkerIndex, int ContentStartIndex);

    private sealed record ListeningOptionMarker(string Label, int MarkerIndex, int ContentStartIndex);
}
