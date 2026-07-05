using BusinessLogicLayer.DTOs.Blog;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/blog-posts")]
public class BlogPostsController : ControllerBase
{
    private readonly IBlogPostService _blogPostService;

    public BlogPostsController(IBlogPostService blogPostService)
    {
        _blogPostService = blogPostService;
    }

    /// <summary>
    /// Get a paginated list of published blog posts.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<BlogPostListItemResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPublished([FromQuery] BlogPostQueryRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _blogPostService.GetPublishedAsync(request);
            return Ok(ApiResponse<PagedResponse<BlogPostListItemResponse>>.Ok(response, "Get published blog posts successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Get featured published blog posts.
    /// </summary>
    [HttpGet("featured")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<BlogPostListItemResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetFeatured([FromQuery] int take = 3)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        var response = await _blogPostService.GetFeaturedAsync(take);
        return Ok(ApiResponse<List<BlogPostListItemResponse>>.Ok(response, "Get featured blog posts successfully."));
    }

    /// <summary>
    /// Get a published blog post by slug.
    /// </summary>
    [HttpGet("{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPublishedBySlug(string slug)
    {
        try
        {
            var response = await _blogPostService.GetPublishedBySlugAsync(slug);
            return Ok(ApiResponse<BlogPostResponse>.Ok(response, "Get blog post successfully."));
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
    /// Get a paginated list of blog posts for administration.
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<BlogPostListItemResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetForAdmin([FromQuery] BlogPostQueryRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _blogPostService.GetForAdminAsync(request);
            return Ok(ApiResponse<PagedResponse<BlogPostListItemResponse>>.Ok(response, "Get blog posts successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Get a blog post by ID for administration.
    /// </summary>
    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAdminById(int id)
    {
        try
        {
            var response = await _blogPostService.GetAdminByIdAsync(id);
            return Ok(ApiResponse<BlogPostResponse>.Ok(response, "Get blog post successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Create a blog post.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create([FromBody] CreateBlogPostRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _blogPostService.CreateAsync(request);
            return CreatedAtAction(
                nameof(GetAdminById),
                new { id = response.BlogPostId },
                ApiResponse<BlogPostResponse>.Ok(response, "Create blog post successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Create a presigned URL for uploading a Blog cover image to Cloudflare R2.
    /// </summary>
    [HttpPost("cover-upload-url")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<BlogCoverUploadUrlResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateCoverUploadUrl([FromBody] CreateBlogCoverUploadUrlRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _blogPostService.CreateCoverUploadUrlAsync(request);
            return Ok(ApiResponse<BlogCoverUploadUrlResponse>.Ok(response, "Create Blog cover upload URL successfully."));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Update a blog post.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBlogPostRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _blogPostService.UpdateAsync(id, request);
            return Ok(ApiResponse<BlogPostResponse>.Ok(response, "Update blog post successfully."));
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
    /// Publish a blog post.
    /// </summary>
    [HttpPatch("{id:int}/publish")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Publish(int id)
    {
        try
        {
            var response = await _blogPostService.PublishAsync(id);
            return Ok(ApiResponse<BlogPostResponse>.Ok(response, "Publish blog post successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Move a published blog post back to draft.
    /// </summary>
    [HttpPatch("{id:int}/unpublish")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<BlogPostResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Unpublish(int id)
    {
        try
        {
            var response = await _blogPostService.UnpublishAsync(id);
            return Ok(ApiResponse<BlogPostResponse>.Ok(response, "Unpublish blog post successfully."));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
    }

    /// <summary>
    /// Soft delete a blog post.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _blogPostService.DeleteAsync(id);
            var response = new MessageResponse { Message = "Delete blog post successfully." };
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
