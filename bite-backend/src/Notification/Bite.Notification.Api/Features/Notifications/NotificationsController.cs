using Bite.BuildingBlocks.Identity;
using Bite.Notification.Api.Domain;
using Bite.Notification.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.Notification.Api.Features.Notifications;

[ApiController]
[Route("api/notify")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotifyDbContext _db;
    private readonly ICurrentUser _me;
    public NotificationsController(NotifyDbContext db, ICurrentUser me) { _db = db; _me = me; }

    public record PreferencesRequest(bool? Email, bool? Sms, bool? Push, bool? Marketing);

    [HttpGet]
    public async Task<IActionResult> Mine([FromQuery] string filter = "all", CancellationToken ct = default)
    {
        if (_me.UserId is null) return Unauthorized();
        var q = _db.Notifications.AsNoTracking().Where(n => n.UserId == _me.UserId);
        if (filter == "unread") q = q.Where(n => !n.ReadFlag);
        if (filter == "read")   q = q.Where(n => n.ReadFlag);
        var list = await q.OrderByDescending(n => n.CreatedAt).Take(100).ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var n = await _db.Notifications.FindAsync([id], ct);
        if (n is null || n.UserId != _me.UserId) return NotFound();
        n.ReadFlag = true; n.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var unread = await _db.Notifications.Where(n => n.UserId == _me.UserId && !n.ReadFlag).ToListAsync(ct);
        foreach (var n in unread) { n.ReadFlag = true; n.ReadAt = DateTime.UtcNow; }
        await _db.SaveChangesAsync(ct);
        return Ok(new { count = unread.Count });
    }

    [HttpGet("preferences")]
    public async Task<IActionResult> GetPrefs(CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var p = await _db.Preferences.FindAsync([_me.UserId.Value], ct)
            ?? new NotificationPreference { UserId = _me.UserId.Value };
        return Ok(p);
    }

    [HttpPatch("preferences")]
    public async Task<IActionResult> UpdatePrefs([FromBody] PreferencesRequest req, CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var p = await _db.Preferences.FindAsync([_me.UserId.Value], ct);
        if (p is null) { p = new NotificationPreference { UserId = _me.UserId.Value }; _db.Preferences.Add(p); }
        if (req.Email.HasValue)     p.EmailEnabled     = req.Email.Value;
        if (req.Sms.HasValue)       p.SmsEnabled       = req.Sms.Value;
        if (req.Push.HasValue)      p.PushEnabled      = req.Push.Value;
        if (req.Marketing.HasValue) p.MarketingEnabled = req.Marketing.Value;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
