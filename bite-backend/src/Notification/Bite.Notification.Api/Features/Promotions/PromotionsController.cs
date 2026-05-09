using Bite.BuildingBlocks.Identity;
using Bite.Notification.Api.Infrastructure;
using Bite.Notification.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.Notification.Api.Features.Promotions;

[ApiController]
[Route("api/notify/promotions")]
[Authorize]
public class PromotionsController : ControllerBase
{
    private readonly NotifyDbContext _db;
    private readonly INotificationDispatcher _dispatcher;
    private readonly ICurrentUser _me;

    public PromotionsController(NotifyDbContext db, INotificationDispatcher dispatcher, ICurrentUser me)
    { _db = db; _dispatcher = dispatcher; _me = me; }

    public record SendPromotionRequest(string Channel, string Subject, string Body, string Audience);

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendPromotionRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Director, UserRole.Admin)) return Forbid();

        // In real life: query Identity service via Refit for users matching audience.
        // For now, target everyone who has marketing enabled.
        var targets = await _db.Preferences.AsNoTracking()
            .Where(p => p.MarketingEnabled).Take(10_000).ToListAsync(ct);

        foreach (var t in targets)
        {
            await _dispatcher.DispatchAsync(t.UserId, Domain.NotificationType.Promotion,
                req.Subject, req.Body, new { req.Channel, req.Audience }, ct: ct);
        }
        return Ok(new { sent = targets.Count, audience = req.Audience, channel = req.Channel });
    }
}
