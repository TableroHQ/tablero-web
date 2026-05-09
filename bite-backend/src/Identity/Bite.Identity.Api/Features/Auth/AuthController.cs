using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bite.Identity.Api.Features.Auth;

[ApiController]
[Route("api/identity/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    private string? Ip => HttpContext.Connection.RemoteIpAddress?.ToString();
    private string? Ua => Request.Headers.UserAgent.ToString();

    [HttpPost("register"), AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req, CancellationToken ct)
        => Ok(await _auth.RegisterAsync(req, ct));

    [HttpPost("login"), AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        try { return Ok(await _auth.LoginAsync(req, Ip, Ua, ct)); }
        catch (UnauthorizedAccessException) { return Unauthorized(new { error = "Invalid credentials" }); }
    }

    [HttpPost("refresh"), AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest req, CancellationToken ct)
    {
        try { return Ok(await _auth.RefreshAsync(req.RefreshToken, Ip, Ua, ct)); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { error = ex.Message }); }
    }

    [HttpPost("logout"), AllowAnonymous]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest req, CancellationToken ct)
    {
        await _auth.LogoutAsync(req.RefreshToken, ct);
        return NoContent();
    }

    [HttpPost("forgot-password"), AllowAnonymous]
    public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var code = await _auth.ForgotPasswordAsync(req, ct);
        // In production this code must NOT be returned. Notification service emails it.
        return Ok(new { sent = true, devCode = code });
    }

    [HttpPost("verify-otp"), AllowAnonymous]
    public async Task<IActionResult> Verify([FromBody] VerifyOtpRequest req, CancellationToken ct)
    {
        var ok = await _auth.VerifyOtpAsync(req, ct);
        return ok ? Ok(new { verified = true }) : BadRequest(new { error = "Invalid or expired code" });
    }

    [HttpPost("reset-password"), AllowAnonymous]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        try { await _auth.ResetPasswordAsync(req, ct); return NoContent(); }
        catch (UnauthorizedAccessException) { return BadRequest(new { error = "Invalid or expired code" }); }
    }
}
