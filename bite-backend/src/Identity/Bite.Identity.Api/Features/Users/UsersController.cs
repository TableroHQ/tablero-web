using Bite.BuildingBlocks.Identity;
using Bite.Identity.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.Identity.Api.Features.Users;

[ApiController]
[Route("api/identity/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IdentityDbContext _db;
    private readonly ICurrentUser _me;

    public UsersController(IdentityDbContext db, ICurrentUser me) { _db = db; _me = me; }

    public record UserListItem(Guid Id, string Email, string Username, string Role,
                               bool IsSuspended, Guid? RestaurantId, DateTime CreatedAt);

    public record CreateStaffRequest(string Email, string Username, string Password,
                                     string FullName, UserRole Role, Guid RestaurantId);

    public record ChangeRoleRequest(UserRole Role);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItem>>> List(
        [FromQuery] string? role, [FromQuery] string? search, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();

        var q = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var r))
            q = q.Where(u => u.Role == r);
        if (!string.IsNullOrEmpty(search))
            q = q.Where(u => u.Email.Contains(search) || u.Username.Contains(search) || (u.FullName ?? "").Contains(search));

        var list = await q.Select(u => new UserListItem(u.Id, u.Email, u.Username, u.Role.ToString(),
            u.IsSuspended, u.RestaurantId, u.CreatedAt)).Take(200).ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaff(
        [FromBody] CreateStaffRequest req,
        [FromServices] Auth.IPasswordHasher hasher,
        CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();

        if (await _db.Users.AnyAsync(u => u.Email == req.Email || u.Username == req.Username, ct))
            return Conflict(new { error = "Email or username taken" });

        var user = new Domain.User
        {
            Email = req.Email.ToLowerInvariant(),
            Username = req.Username,
            FullName = req.FullName,
            PasswordHash = hasher.Hash(req.Password),
            Role = req.Role,
            RestaurantId = req.RestaurantId
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(List), new { }, new { user.Id });
    }

    [HttpPatch("{id:guid}/role")]
    public async Task<IActionResult> ChangeRole(Guid id, [FromBody] ChangeRoleRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var u = await _db.Users.FindAsync([id], ct);
        if (u is null) return NotFound();
        u.Role = req.Role;
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var u = await _db.Users.FindAsync([id], ct);
        if (u is null) return NotFound();
        u.IsSuspended = !u.IsSuspended;
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new { suspended = u.IsSuspended });
    }
}
