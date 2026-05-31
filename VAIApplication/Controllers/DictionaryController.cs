using System.Security.Claims;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Dictionary;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/dictionary")]
[Authorize]
public class DictionaryController : ControllerBase
{
    private readonly IDictionaryService _dictionaryService;

    public DictionaryController(IDictionaryService dictionaryService)
    {
        _dictionaryService = dictionaryService;
    }

    /// <summary>
    /// Tra tu tieng Anh, uu tien cache trong PostgreSQL, neu chua co se goi Dictionary API va MyMemory roi luu vao tu dien ca nhan.
    /// </summary>
    /// <param name="request">Tu tieng Anh can tra.</param>
    /// <returns>Thong tin nghia, phien am, vi du va ban ghi tu dien ca nhan cua user dang dang nhap.</returns>
    [HttpPost("search")]
    [ProducesResponseType(typeof(ApiResponse<DictionarySearchResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Search([FromBody] DictionarySearchRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _dictionaryService.SearchAsync(GetUserId(), request);
            return Ok(ApiResponse<DictionarySearchResponse>.Ok(response, "Search dictionary successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status502BadGateway, ApiResponse<object>.Fail("Dictionary provider is unavailable."));
        }
        catch (TaskCanceledException)
        {
            return StatusCode(StatusCodes.Status504GatewayTimeout, ApiResponse<object>.Fail("Dictionary provider request timed out."));
        }
    }

    /// <summary>
    /// Lay danh sach tu trong tu dien ca nhan cua user dang dang nhap, co phan trang va loc favorite.
    /// </summary>
    /// <param name="request">Thong tin phan trang va loc favorite.</param>
    /// <returns>Danh sach tu da luu cua user.</returns>
    [HttpGet("my-words")]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<UserVocabularyResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetMyWords([FromQuery] MyWordsQueryRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        var response = await _dictionaryService.GetMyWordsAsync(GetUserId(), request);
        return Ok(ApiResponse<PagedResponse<UserVocabularyResponse>>.Ok(response, "Get personal dictionary successfully."));
    }

    /// <summary>
    /// Cap nhat ghi chu ca nhan cho mot tu da luu trong tu dien cua user dang dang nhap.
    /// </summary>
    /// <param name="request">DictionaryEntryId va ghi chu moi.</param>
    /// <returns>Ban ghi tu dien ca nhan sau khi cap nhat.</returns>
    [HttpPut("note")]
    [ProducesResponseType(typeof(ApiResponse<UserVocabularyResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateNote([FromBody] UpdateVocabularyNoteRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _dictionaryService.UpdateNoteAsync(GetUserId(), request);
            return Ok(ApiResponse<UserVocabularyResponse>.Ok(response, "Update vocabulary note successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Bat/tat favorite cho mot tu da luu trong tu dien cua user dang dang nhap.
    /// </summary>
    /// <param name="request">DictionaryEntryId va trang thai favorite moi.</param>
    /// <returns>Ban ghi tu dien ca nhan sau khi cap nhat favorite.</returns>
    [HttpPut("favorite")]
    [ProducesResponseType(typeof(ApiResponse<UserVocabularyResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ToggleFavorite([FromBody] ToggleVocabularyFavoriteRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _dictionaryService.ToggleFavoriteAsync(GetUserId(), request);
            return Ok(ApiResponse<UserVocabularyResponse>.Ok(response, "Update vocabulary favorite successfully."));
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
