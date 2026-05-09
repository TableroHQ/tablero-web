using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Identity;
using Bite.Delivery.Api.Domain;
using Bite.Delivery.Api.Hubs;
using Bite.Delivery.Api.Infrastructure;
using Bite.Delivery.Api.Services;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Bite.Delivery.Api.Features.Delivery;

[ApiController]
[Route("api/delivery")]
[Authorize]
public class DeliveryController : ControllerBase
{
    private readonly DeliveryDbContext _db;
    private readonly IPublishEndpoint _bus;
    private readonly IAcceptLockService _lock;
    private readonly IHubContext<CourierHub> _hub;
    private readonly ICurrentUser _me;

    public DeliveryController(DeliveryDbContext db, IPublishEndpoint bus,
                              IAcceptLockService al, IHubContext<CourierHub> hub, ICurrentUser me)
    { _db = db; _bus = bus; _lock = al; _hub = hub; _me = me; }

    public record CheckpointRequest(double Lat, double Lng, string? Note);
    public record RateRequest(int Stars, string? Comment);
    public record CourierStatusRequest(bool Online);

    [HttpGet("available")]
    public async Task<IActionResult> Available(CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Courier)) return Forbid();
        var list = await _db.DeliveryOrders.AsNoTracking()
            .Where(d => d.Status == DeliveryStatus.Available)
            .OrderByDescending(d => d.Payout).Take(20).ToListAsync(ct);
        return Ok(list);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Courier)) return Forbid();
        var list = await _db.DeliveryOrders.AsNoTracking()
            .Where(d => d.CourierId == _me.UserId).OrderByDescending(d => d.CreatedAt).Take(50).ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost("{id:guid}/accept")]
    public async Task<IActionResult> Accept(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Courier)) return Forbid();
        var ok = await _lock.TryAcceptAsync(id, _me.UserId!.Value);
        if (!ok) return Conflict(new { error = "Already taken" });

        var d = await _db.DeliveryOrders.FindAsync([id], ct);
        if (d is null || d.Status != DeliveryStatus.Available) return NotFound();

        d.CourierId = _me.UserId;
        d.Status = DeliveryStatus.Assigned;
        d.AssignedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new DeliveryAssigned(d.Id, _me.UserId.Value), ct);
        await _hub.Clients.Group($"couriers:{d.RestaurantId}").SendAsync("delivery:taken", new { d.Id }, ct);
        return Ok(d);
    }

    [HttpPost("{id:guid}/checkpoint")]
    public async Task<IActionResult> AddCheckpoint(Guid id, [FromBody] CheckpointRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Courier)) return Forbid();
        var d = await _db.DeliveryOrders.FindAsync([id], ct);
        if (d is null || d.CourierId != _me.UserId) return NotFound();
        var cp = new Checkpoint { DeliveryOrderId = id, Lat = req.Lat, Lng = req.Lng, Note = req.Note };
        _db.Checkpoints.Add(cp);
        if (d.Status == DeliveryStatus.Assigned) d.Status = DeliveryStatus.EnRoute;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new DeliveryCheckpoint(id, req.Lat, req.Lng, cp.At), ct);
        return Ok(cp);
    }

    [HttpPost("{id:guid}/delivered")]
    public async Task<IActionResult> Delivered(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Courier)) return Forbid();
        var d = await _db.DeliveryOrders.FindAsync([id], ct);
        if (d is null || d.CourierId != _me.UserId) return NotFound();
        d.Status = DeliveryStatus.Delivered;
        d.DeliveredAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/confirm-receipt")]
    public async Task<IActionResult> Confirm(Guid id, CancellationToken ct)
    {
        var d = await _db.DeliveryOrders.FindAsync([id], ct);
        if (d is null || d.UserId != _me.UserId) return NotFound();
        d.Status = DeliveryStatus.Confirmed;
        d.ConfirmedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new DeliveryConfirmed(d.Id, d.OrderId, d.ConfirmedAt!.Value), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/rate")]
    public async Task<IActionResult> Rate(Guid id, [FromBody] RateRequest req, CancellationToken ct)
    {
        if (req.Stars is < 1 or > 5) return BadRequest();
        var d = await _db.DeliveryOrders.FindAsync([id], ct);
        if (d is null || d.UserId != _me.UserId || d.CourierId is null) return NotFound();

        var rating = new CourierRating
        {
            DeliveryOrderId = id, CourierId = d.CourierId.Value, UserId = _me.UserId!.Value,
            Stars = req.Stars, Comment = req.Comment
        };
        _db.Ratings.Add(rating);

        var courier = await _db.Couriers.FindAsync([d.CourierId.Value], ct);
        if (courier is not null)
        {
            var n = courier.TotalDeliveries;
            courier.AverageRating = (courier.AverageRating * n + req.Stars) / (n + 1);
            courier.TotalDeliveries = n + 1;
        }
        await _db.SaveChangesAsync(ct);
        return Ok(rating);
    }

    [HttpPost("courier/status")]
    public async Task<IActionResult> SetOnline([FromBody] CourierStatusRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Courier)) return Forbid();
        var c = await _db.Couriers.FindAsync([_me.UserId!.Value], ct);
        if (c is null)
        {
            c = new Courier { Id = _me.UserId.Value, DisplayName = _me.Email ?? "Courier" };
            _db.Couriers.Add(c);
        }
        c.IsOnline = req.Online;
        c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new { online = c.IsOnline });
    }
}
