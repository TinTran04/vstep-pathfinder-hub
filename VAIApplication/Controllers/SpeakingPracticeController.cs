using System.Security.Claims;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Speaking;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/speaking-practice")]
[Authorize]
public class SpeakingPracticeController : ControllerBase
{
    private readonly ISpeakingPracticeService _speakingPracticeService;

    public SpeakingPracticeController(ISpeakingPracticeService speakingPracticeService)
    {
        _speakingPracticeService = speakingPracticeService;
    }

    /// <summary>
    /// Tao presigned URL de client upload mot file audio Speaking cuoi cung len Cloudflare R2.
    /// </summary>
    [HttpPost("upload-url")]
    [ProducesResponseType(typeof(ApiResponse<SpeakingUploadUrlResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateUploadUrl([FromBody] CreateSpeakingUploadUrlRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _speakingPracticeService.CreateUploadUrlAsync(GetUserId(), request);
            return Ok(ApiResponse<SpeakingUploadUrlResponse>.Ok(response, "Create speaking upload URL successfully."));
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
    /// Luu metadata bai Speaking da upload len R2 va goi OpenRouter de cham diem bang AI.
    /// </summary>
    [HttpPost("{examId:int}/submit")]
    [ProducesResponseType(typeof(ApiResponse<SpeakingSubmissionResponse>), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Submit(int examId, [FromBody] SubmitSpeakingRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _speakingPracticeService.SubmitAsync(GetUserId(), examId, request);
            return StatusCode(StatusCodes.Status202Accepted, ApiResponse<SpeakingSubmissionResponse>.Ok(response, "Speaking submission graded by AI."));
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
    /// Lay trang thai va ket qua bai Speaking da nop cua nguoi dung dang nhap.
    /// </summary>
    [HttpGet("submissions/{submissionId:int}")]
    [ProducesResponseType(typeof(ApiResponse<SpeakingResultResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSubmission(int submissionId)
    {
        try
        {
            var response = await _speakingPracticeService.GetSubmissionAsync(GetUserId(), submissionId);
            return Ok(ApiResponse<SpeakingResultResponse>.Ok(response, "Get speaking submission successfully."));
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
