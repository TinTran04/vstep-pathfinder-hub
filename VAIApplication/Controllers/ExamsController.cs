using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/exams")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IExamService _examService;

    public ExamsController(IExamService examService)
    {
        _examService = examService;
    }

    /// <summary>
    /// Lay danh sach de luyen tap co phan trang; nguoi dung thuong chi thay de da publish.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<ExamResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetExams([FromQuery] ExamQueryRequest request)
    {
        try
        {
            var includeUnpublished = User.IsInRole("admin") || User.IsInRole("staff");
            var response = await _examService.GetExamsAsync(request, includeUnpublished);
            return Ok(ApiResponse<PagedResponse<ExamResponse>>.Ok(response, "Get exams successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Lay chi tiet de luyen tap theo id, bao gom section, question va option.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ExamDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetExamById(int id)
    {
        try
        {
            var includeUnpublished = User.IsInRole("admin") || User.IsInRole("staff");
            var response = await _examService.GetExamByIdAsync(id, includeUnpublished);
            return Ok(ApiResponse<ExamDetailResponse>.Ok(response, "Get exam successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Tao de luyen tap moi; chi admin va staff duoc quan ly noi dung.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<ExamResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateExam([FromBody] CreateExamRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _examService.CreateExamAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<ExamResponse>.Ok(response, "Create exam successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Cap nhat thong tin de luyen tap; chi admin va staff duoc thuc hien.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<ExamResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateExam(int id, [FromBody] UpdateExamRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _examService.UpdateExamAsync(id, request);
            return Ok(ApiResponse<ExamResponse>.Ok(response, "Update exam successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Xoa mem de luyen tap; chi admin va staff duoc thuc hien.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteExam(int id)
    {
        try
        {
            await _examService.DeleteExamAsync(id);
            var response = new MessageResponse { Message = "Delete exam successfully." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Tao section cho de luyen tap; chi admin va staff duoc thuc hien.
    /// </summary>
    [HttpPost("{examId:int}/sections")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<SectionResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateSection(int examId, [FromBody] CreateSectionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _examService.CreateSectionAsync(examId, request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<SectionResponse>.Ok(response, "Create section successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Cap nhat section cua de luyen tap; chi admin va staff duoc thuc hien.
    /// </summary>
    [HttpPut("sections/{sectionId:int}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<SectionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateSection(int sectionId, [FromBody] UpdateSectionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _examService.UpdateSectionAsync(sectionId, request);
            return Ok(ApiResponse<SectionResponse>.Ok(response, "Update section successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Xoa mem section cua de luyen tap; chi admin va staff duoc thuc hien.
    /// </summary>
    [HttpDelete("sections/{sectionId:int}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteSection(int sectionId)
    {
        try
        {
            await _examService.DeleteSectionAsync(sectionId);
            var response = new MessageResponse { Message = "Delete section successfully." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Tao question kem options cho section; chi admin va staff duoc thuc hien.
    /// </summary>
    [HttpPost("sections/{sectionId:int}/questions")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<QuestionResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateQuestion(int sectionId, [FromBody] CreateQuestionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _examService.CreateQuestionAsync(sectionId, request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<QuestionResponse>.Ok(response, "Create question successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Cap nhat question va danh sach options; chi admin va staff duoc thuc hien.
    /// </summary>
    [HttpPut("questions/{questionId:int}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<QuestionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateQuestion(int questionId, [FromBody] UpdateQuestionRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _examService.UpdateQuestionAsync(questionId, request);
            return Ok(ApiResponse<QuestionResponse>.Ok(response, "Update question successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Xoa mem question cua section; chi admin va staff duoc thuc hien.
    /// </summary>
    [HttpDelete("questions/{questionId:int}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteQuestion(int questionId)
    {
        try
        {
            await _examService.DeleteQuestionAsync(questionId);
            var response = new MessageResponse { Message = "Delete question successfully." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    private Dictionary<string, string[]> GetModelStateErrors()
    {
        return ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .ToDictionary(
                entry => entry.Key,
                entry => entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray());
    }
}
