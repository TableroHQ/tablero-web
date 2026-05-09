using Bite.BuildingBlocks.Identity;
using Bite.Identity.Api.Domain;
using Bite.Identity.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.Identity.Api.Features.Profile;

[ApiController]
[Route("api/identity/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IdentityDbContext _db;
    private readonly ICurrentUser _me;

    public ProfileController(IdentityDbContext db, ICurrentUser me) { _db = db; _me = me; }

    public record ProfileDto(Guid Id, string Email, string Username, string? FullName,
                             string? Phone, string? AvatarUrl, string Role, DateTime CreatedAt);

    public record UpdateProfileRequest(string? FullName, string? Phone, string? AvatarUrl);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

    [HttpGet]
    public async Task<ActionResult<ProfileDto>> Me(CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var u = await _db.Users.FindAsync([_me.UserId.Value], ct);
        if (u is null) return NotFound();
        return Ok(new ProfileDto(u.Id, u.Email, u.Username, u.FullName, u.Phone, u.AvatarUrl, u.Role.ToString(), u.CreatedAt));
    }

    [HttpPatch]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var u = await _db.Users.FindAsync([_me.UserId.Value], ct);
        if (u is null) return NotFound();
        if (req.FullName is not null)  u.FullName  = req.FullName;
        if (req.Phone is not null)     u.Phone     = req.Phone;
        if (req.AvatarUrl is not null) u.AvatarUrl = req.AvatarUrl;
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest req,
        [FromServices] Auth.IPasswordHasher hasher,
        CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var u = await _db.Users.FindAsync([_me.UserId.Value], ct);
        if (u is null) return NotFound();
        if (!hasher.Verify(req.CurrentPassword, u.PasswordHash))
            return BadRequest(new { error = "Current password is incorrect" });
        u.PasswordHash = hasher.Hash(req.NewPassword);
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteSelf(CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var u = await _db.Users.FindAsync([_me.UserId.Value], ct);
        if (u is null) return NotFound();
        u.IsSuspended = true;
        u.Email = $"deleted-{Guid.NewGuid():N}@bite.deleted";
        u.Username = $"deleted-{Guid.NewGuid():N}";
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
