using System.Security.Claims;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Exam;
using BusinessLogicLayer.DTOs.Reading;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/reading-practice")]
[Authorize]
public class ReadingPracticeController : ControllerBase
{
    private readonly IPracticeService _practiceService;

    public ReadingPracticeController(IPracticeService practiceService)
    {
        _practiceService = practiceService;
    }

    /// <summary>
    /// Bat dau bai luyen Reading va tao attempt cho nguoi dung dang nhap.
    /// </summary>
    [HttpPost("{examId:int}/start")]
    [ProducesResponseType(typeof(ApiResponse<StartPracticeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Start(int examId)
    {
        try
        {
            var response = await _practiceService.StartPracticeAsync(GetUserId(), examId, "reading");
            return Ok(ApiResponse<StartPracticeResponse>.Ok(response, "Start reading practice successfully."));
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
    /// Nop dap an Reading, cham diem tu dong va luu tung cau tra loi.
    /// </summary>
    [HttpPost("{attemptId:int}/submit")]
    [ProducesResponseType(typeof(ApiResponse<SubmitPracticeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Submit(int attemptId, [FromBody] SubmitReadingRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _practiceService.SubmitPracticeAsync(GetUserId(), attemptId, "reading", request.Answers, request.DurationUsedSeconds);
            return Ok(ApiResponse<SubmitPracticeResponse>.Ok(response, "Submit reading practice successfully."));
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
    /// Lay ket qua bai luyen Reading cua nguoi dung dang nhap.
    /// </summary>
    [HttpGet("attempts/{attemptId:int}/result")]
    [ProducesResponseType(typeof(ApiResponse<AttemptResultResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetResult(int attemptId)
    {
        try
        {
            var response = await _practiceService.GetResultAsync(GetUserId(), attemptId);
            return Ok(ApiResponse<AttemptResultResponse>.Ok(response, "Get reading result successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    private int GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var parsedUserId)
            ? parsedUserId
            : throw new UnauthorizedAccessException("Invalid user token.");
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
