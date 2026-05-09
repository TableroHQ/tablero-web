using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Identity;
using Bite.Reservation.Api.Domain;
using Bite.Reservation.Api.Infrastructure;
using Bite.Reservation.Api.Services;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.Reservation.Api.Features.Reservations;

[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly ReservationDbContext _db;
    private readonly ISlotLockService _lock;
    private readonly IPublishEndpoint _bus;
    private readonly ICurrentUser _me;

    public ReservationsController(ReservationDbContext db, ISlotLockService slot,
                                  IPublishEndpoint bus, ICurrentUser me)
    { _db = db; _lock = slot; _bus = bus; _me = me; }

    public record CreateReservationRequest(Guid RestaurantId, Guid TableId, DateTime SlotStart,
        int PartySize, string? GuestName, string? GuestPhone, string? Notes,
        IEnumerable<PreOrderItem>? PreOrders);
    public record PreOrderItem(Guid MenuItemId, string MenuItemName, int Qty, string? Modifications);

    public record AvailabilityRequest(Guid RestaurantId, DateOnly Date, int PartySize);
    public record SlotResponse(Guid TableId, string TableCode, string Zone, int Seats,
                               IEnumerable<string> AvailableTimes);

    [HttpGet("availability"), AllowAnonymous]
    public async Task<ActionResult<IEnumerable<SlotResponse>>> Availability(
        [FromQuery] Guid restaurantId, [FromQuery] DateOnly date, [FromQuery] int partySize, CancellationToken ct)
    {
        var tables = await _db.Tables.AsNoTracking()
            .Where(t => t.RestaurantId == restaurantId && t.IsActive && t.Seats >= partySize)
            .ToListAsync(ct);

        var dayStart = date.ToDateTime(new TimeOnly(11, 0));
        var dayEnd = date.ToDateTime(new TimeOnly(23, 0));
        var booked = await _db.Reservations.AsNoTracking()
            .Where(r => r.SlotStart >= dayStart && r.SlotStart < dayEnd
                     && r.Status != ReservationStatus.Cancelled && r.Status != ReservationStatus.NoShow)
            .Select(r => new { r.TableId, r.SlotStart })
            .ToListAsync(ct);

        var result = tables.Select(t =>
        {
            var slots = new List<string>();
            for (var time = new TimeOnly(11, 0); time < new TimeOnly(23, 0); time = time.AddMinutes(30))
            {
                var slotDt = date.ToDateTime(time);
                if (!booked.Any(b => b.TableId == t.Id && b.SlotStart == slotDt))
                    slots.Add(time.ToString("HH:mm"));
            }
            return new SlotResponse(t.Id, t.Code, t.Zone.ToString(), t.Seats, slots);
        }).Where(s => s.AvailableTimes.Any());

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest req, CancellationToken ct)
    {
        await using var redisLock = await _lock.AcquireAsync(req.TableId, req.SlotStart);
        if (redisLock is null) return Conflict(new { error = "Another booking is being processed for this slot" });

        var clash = await _db.Reservations.AnyAsync(r => r.TableId == req.TableId && r.SlotStart == req.SlotStart
            && r.Status != ReservationStatus.Cancelled && r.Status != ReservationStatus.NoShow, ct);
        if (clash) return Conflict(new { error = "Slot just got taken" });

        var res = new Domain.Reservation
        {
            RestaurantId = req.RestaurantId,
            UserId = _me.UserId,
            GuestName = req.GuestName,
            GuestPhone = req.GuestPhone,
            TableId = req.TableId,
            SlotStart = req.SlotStart,
            SlotEnd = req.SlotStart.AddMinutes(90),
            PartySize = req.PartySize,
            Notes = req.Notes,
            Status = ReservationStatus.Confirmed,
            ConfirmedAt = DateTime.UtcNow
        };

        if (req.PreOrders is not null)
        {
            foreach (var p in req.PreOrders)
                res.PreOrders.Add(new ReservationPreOrder
                {
                    MenuItemId = p.MenuItemId, MenuItemName = p.MenuItemName,
                    Qty = p.Qty, Modifications = p.Modifications
                });
        }

        _db.Reservations.Add(res);
        await _db.SaveChangesAsync(ct);

        await _bus.Publish(new ReservationConfirmed(
            res.Id, res.UserId ?? Guid.Empty, res.RestaurantId,
            res.TableId, res.SlotStart, res.PartySize), ct);

        return CreatedAtAction(nameof(Get), new { id = res.Id }, new { res.Id, res.Status });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var r = await _db.Reservations.Include(x => x.PreOrders).FirstOrDefaultAsync(x => x.Id == id, ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var list = await _db.Reservations.AsNoTracking()
            .Where(r => r.UserId == _me.UserId).OrderByDescending(r => r.SlotStart).Take(50).ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromQuery] string? reason, CancellationToken ct)
    {
        var r = await _db.Reservations.FindAsync([id], ct);
        if (r is null) return NotFound();
        if (r.Status is ReservationStatus.Completed or ReservationStatus.Cancelled) return BadRequest();
        r.Status = ReservationStatus.Cancelled;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new ReservationCancelled(id, reason ?? ""), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/seat")]
    public async Task<IActionResult> Seat(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Waiter, UserRole.Admin)) return Forbid();
        var r = await _db.Reservations.FindAsync([id], ct);
        if (r is null) return NotFound();
        r.Status = ReservationStatus.Seated;
        r.SeatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new ReservationSeated(id, Guid.NewGuid(), r.SeatedAt!.Value), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Waiter, UserRole.Cashier, UserRole.Admin)) return Forbid();
        var r = await _db.Reservations.FindAsync([id], ct);
        if (r is null) return NotFound();
        r.Status = ReservationStatus.Completed;
        r.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new ReservationCompleted(id, r.CompletedAt!.Value), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/no-show")]
    public async Task<IActionResult> NoShow(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Waiter, UserRole.Admin)) return Forbid();
        var r = await _db.Reservations.FindAsync([id], ct);
        if (r is null) return NotFound();
        r.Status = ReservationStatus.NoShow;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new ReservationNoShow(id), ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/tables")]
[Authorize]
public class TablesController : ControllerBase
{
    private readonly ReservationDbContext _db;
    private readonly ICurrentUser _me;
    public TablesController(ReservationDbContext db, ICurrentUser me) { _db = db; _me = me; }

    public record CreateTableRequest(Guid RestaurantId, string Code, TableZone Zone, int Seats);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid restaurantId, CancellationToken ct)
        => Ok(await _db.Tables.AsNoTracking().Where(t => t.RestaurantId == restaurantId).ToListAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTableRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var t = new RestaurantTable { RestaurantId = req.RestaurantId, Code = req.Code, Zone = req.Zone, Seats = req.Seats };
        _db.Tables.Add(t);
        await _db.SaveChangesAsync(ct);
        return Ok(t);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Admin, UserRole.Director)) return Forbid();
        var t = await _db.Tables.FindAsync([id], ct);
        if (t is null) return NotFound();
        t.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
