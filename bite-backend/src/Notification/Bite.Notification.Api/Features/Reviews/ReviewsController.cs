using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Identity;
using Bite.Notification.Api.Domain;
using Bite.Notification.Api.Infrastructure;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.Notification.Api.Features.Reviews;

[ApiController]
[Route("api/reviews")]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly NotifyDbContext _db;
    private readonly IPublishEndpoint _bus;
    private readonly ICurrentUser _me;

    public ReviewsController(NotifyDbContext db, IPublishEndpoint bus, ICurrentUser me)
    { _db = db; _bus = bus; _me = me; }

    public record SubmitReviewRequest(Guid RestaurantId, Guid? OrderId, Guid? ReservationId,
        int ChefRating, int WaiterRating, int CleanlinessRating, int ServiceRating, string Comment);

    public record ModerationDecision(bool Approve, string? Reason);

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitReviewRequest req, CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var r = new Review
        {
            UserId = _me.UserId,
            RestaurantId = req.RestaurantId,
            OrderId = req.OrderId,
            ReservationId = req.ReservationId,
            ChefRating = req.ChefRating, WaiterRating = req.WaiterRating,
            CleanlinessRating = req.CleanlinessRating, ServiceRating = req.ServiceRating,
            Comment = req.Comment,
            Status = ReviewStatus.Pending
        };
        _db.Reviews.Add(r);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = r.Id }, new { r.Id, r.Status });
    }

    [HttpGet("{id:guid}"), AllowAnonymous]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var r = await _db.Reviews.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpGet("public/{restaurantId:guid}"), AllowAnonymous]
    public async Task<IActionResult> Public(Guid restaurantId, CancellationToken ct)
        => Ok(await _db.Reviews.AsNoTracking()
            .Where(r => r.RestaurantId == restaurantId && r.Status == ReviewStatus.Published)
            .OrderByDescending(r => r.PublishedAt).Take(50).ToListAsync(ct));

    [HttpGet("moderation")]
    public async Task<IActionResult> Pending([FromQuery] string filter = "pending", CancellationToken ct = default)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var q = _db.Reviews.AsNoTracking();
        q = filter switch
        {
            "pending" => q.Where(r => r.Status == ReviewStatus.Pending),
            "published" => q.Where(r => r.Status == ReviewStatus.Published),
            "rejected" => q.Where(r => r.Status == ReviewStatus.Rejected || r.Status == ReviewStatus.Removed),
            _ => q
        };
        return Ok(await q.OrderByDescending(r => r.CreatedAt).Take(200).ToListAsync(ct));
    }

    [HttpPost("{id:guid}/moderate")]
    public async Task<IActionResult> Moderate(Guid id, [FromBody] ModerationDecision req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var r = await _db.Reviews.FindAsync([id], ct);
        if (r is null) return NotFound();
        if (req.Approve)
        {
            r.Status = ReviewStatus.Published;
            r.PublishedAt = DateTime.UtcNow;
            r.ModeratorId = _me.UserId;
            await _bus.Publish(new ReviewSubmitted(r.Id, r.UserId, r.RestaurantId,
                r.ChefRating, r.WaiterRating, r.CleanlinessRating, r.ServiceRating, r.Comment), ct);
        }
        else
        {
            r.Status = ReviewStatus.Rejected;
            r.ModerationReason = req.Reason;
            r.ModeratorId = _me.UserId;
        }
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id, [FromQuery] string? reason, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var r = await _db.Reviews.FindAsync([id], ct);
        if (r is null) return NotFound();
        r.Status = ReviewStatus.Removed;
        r.ModerationReason = reason;
        r.ModeratorId = _me.UserId;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
