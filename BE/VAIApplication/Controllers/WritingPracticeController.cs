using System.Security.Claims;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Writing;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/writing-practice")]
[Authorize]
public class WritingPracticeController : ControllerBase
{
    private readonly IWritingPracticeService _writingPracticeService;

    public WritingPracticeController(IWritingPracticeService writingPracticeService)
    {
        _writingPracticeService = writingPracticeService;
    }

    /// <summary>
    /// Nop bai Writing de Worker Service cham diem bat dong bo sau do.
    /// </summary>
    [HttpPost("{examId:int}/submit")]
    [ProducesResponseType(typeof(ApiResponse<WritingSubmissionResponse>), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Submit(int examId, [FromBody] SubmitWritingRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _writingPracticeService.SubmitAsync(GetUserId(), examId, request);
            return StatusCode(StatusCodes.Status202Accepted, ApiResponse<WritingSubmissionResponse>.Ok(response, "Writing submission queued for grading."));
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
    /// Lay trang thai va ket qua bai Writing da nop cua nguoi dung dang nhap.
    /// </summary>
    [HttpGet("submissions/{submissionId:int}")]
    [ProducesResponseType(typeof(ApiResponse<WritingResultResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSubmission(int submissionId)
    {
        try
        {
            var response = await _writingPracticeService.GetSubmissionAsync(GetUserId(), submissionId);
            return Ok(ApiResponse<WritingResultResponse>.Ok(response, "Get writing submission successfully."));
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
