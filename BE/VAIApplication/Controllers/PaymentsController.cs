using System.Security.Claims;
using System.Text.Json;
using BusinessLogicLayer.DTOs.Common;
using BusinessLogicLayer.DTOs.Payment;
using BusinessLogicLayer.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VAIApplication.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>
    /// Tao link thanh toan payOS de nang cap SubscriptionPlan cho user dang dang nhap.
    /// </summary>
    /// <param name="request">SubscriptionPlanId can mua; amount duoc lay tu database, khong tin frontend.</param>
    /// <returns>Thong tin link checkout payOS va ma giao dich noi bo.</returns>
    [HttpPost("payos/subscription")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<SubscriptionPaymentResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status502BadGateway)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreatePayOsSubscriptionPayment([FromBody] CreateSubscriptionPaymentRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid request", GetModelStateErrors()));
        }

        try
        {
            var response = await _paymentService.CreateSubscriptionPaymentAsync(GetUserId(), request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<SubscriptionPaymentResponse>.Ok(response, "Create payOS payment link successfully."));
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
            return StatusCode(StatusCodes.Status502BadGateway, ApiResponse<object>.Fail("payOS provider is unavailable."));
        }
        catch (TaskCanceledException)
        {
            return StatusCode(StatusCodes.Status504GatewayTimeout, ApiResponse<object>.Fail("payOS provider request timed out."));
        }
    }

    /// <summary>
    /// Webhook payOS thong bao thanh toan thanh cong; verify signature, chong double payment va cap nhat subscription trong transaction.
    /// </summary>
    /// <returns>Thong bao webhook da duoc xu ly.</returns>
    [HttpPost("payos/webhook")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<MessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> PayOsWebhook()
    {
        using var reader = new StreamReader(Request.Body);
        var rawBody = await reader.ReadToEndAsync();
        if (string.IsNullOrWhiteSpace(rawBody))
        {
            return BadRequest(ApiResponse<object>.Fail("Webhook body is required."));
        }

        PayOsWebhookRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<PayOsWebhookRequest>(rawBody);
        }
        catch (JsonException)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid webhook JSON."));
        }

        if (request is null)
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid webhook payload."));
        }

        try
        {
            await _paymentService.HandlePayOsWebhookAsync(request, rawBody);
            var response = new MessageResponse { Message = "Webhook processed successfully." };
            return Ok(ApiResponse<MessageResponse>.Ok(response, response.Message));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(ApiResponse<object>.Fail(exception.Message));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(ApiResponse<object>.Fail(exception.Message));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(ApiResponse<object>.Fail(exception.Message));
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
