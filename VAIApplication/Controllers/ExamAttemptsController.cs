using System.Security.Claims;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/attempts")]
[Authorize]
public class ExamAttemptsController : ControllerBase
{
    private readonly IPracticeService _practiceService;

    public ExamAttemptsController(IPracticeService practiceService)
    {
        _practiceService = practiceService;
    }

    /// <summary>
    /// Lay review day du cua 1 attempt bao gom cac phan Reading, Listening, Writing, Speaking.
    /// </summary>
    [HttpGet("{attemptId:int}/review")]
    [ProducesResponseType(typeof(ApiResponse<AttemptReviewResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetReview(int attemptId)
    {
        try
        {
            var isPrivileged = User.IsInRole("admin") || User.IsInRole("staff");
            var response = await _practiceService.GetAttemptReviewAsync(GetUserId(), attemptId, isPrivileged);
            return Ok(ApiResponse<AttemptReviewResponse>.Ok(response, "Get attempt review successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Bat dau bai Mock Test.
    /// </summary>
    [HttpPost("start-mock-test/{examId:int}")]
    [ProducesResponseType(typeof(ApiResponse<StartPracticeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartMockTest(int examId)
    {
        try
        {
            var response = await _practiceService.StartPracticeAsync(GetUserId(), examId, "mock_test");
            return Ok(ApiResponse<StartPracticeResponse>.Ok(response, "Mock test started successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Lay attempt dang lam do (in_progress) cua user.
    /// </summary>
    [HttpGet("in-progress")]
    [ProducesResponseType(typeof(ApiResponse<InProgressAttemptResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetInProgress()
    {
        var response = await _practiceService.GetInProgressAttemptAsync(GetUserId());
        if (response is null)
        {
            return NoContent();
        }
        return Ok(ApiResponse<InProgressAttemptResponse>.Ok(response, "Get in-progress attempt successfully."));
    }

    /// <summary>
    /// Autosave trang thai lam bai dang do.
    /// </summary>
    [HttpPatch("{attemptId:int}/autosave")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Autosave(int attemptId, [FromBody] AutosaveRequest request)
    {
        try
        {
            await _practiceService.AutosaveAttemptAsync(GetUserId(), attemptId, request);
            return Ok(ApiResponse<object>.Ok(new { }, "Autosaved successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Chot va nop bai thi.
    /// </summary>
    [HttpPost("{attemptId:int}/submit")]
    [ProducesResponseType(typeof(ApiResponse<SubmitPracticeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitMockTest(int attemptId, [FromBody] SubmitMockTestRequest request)
    {
        try
        {
            var response = await _practiceService.SubmitMockTestAsync(GetUserId(), attemptId, request);
            return Ok(ApiResponse<SubmitPracticeResponse>.Ok(response, "Mock test submitted successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Lay ket qua tong quan cua attempt.
    /// </summary>
    [HttpGet("{attemptId:int}/result")]
    [ProducesResponseType(typeof(ApiResponse<AttemptResultResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResultSummary(int attemptId)
    {
        try
        {
            var response = await _practiceService.GetResultAsync(GetUserId(), attemptId);
            return Ok(ApiResponse<AttemptResultResponse>.Ok(response, "Get attempt result successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Bat dau bai Mock Test Random.
    /// </summary>
    [HttpPost("random-mock-test/start")]
    [ProducesResponseType(typeof(ApiResponse<StartRandomMockTestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StartRandomMockTest()
    {
        try
        {
            var response = await _practiceService.StartRandomMockTestAsync(GetUserId());
            return Ok(ApiResponse<StartRandomMockTestResponse>.Ok(response, "Random mock test started successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Lay lich su lam bai cua user.
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(ApiResponse<HistoryPagedResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null, [FromQuery] string? mode = null)
    {
        var response = await _practiceService.GetHistoryAsync(GetUserId(), page, pageSize, status, mode);
        return Ok(ApiResponse<HistoryPagedResponse>.Ok(response, "Get history successfully."));
    }

    /// <summary>
    /// Xoa/huy bai thi (soft delete).
    /// </summary>
    [HttpDelete("{attemptId:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAttempt(int attemptId)
    {
        try
        {
            await _practiceService.DeleteAttemptAsync(GetUserId(), attemptId);
            return Ok(ApiResponse<object>.Ok(new { }, "Attempt deleted successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    private int GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var parsedUserId)
            ? parsedUserId
            : throw new UnauthorizedAccessException("Invalid user token.");
    }
}
