using Bite.BuildingBlocks.Identity;
using Bite.Payment.Api.Domain;
using Bite.Payment.Api.Infrastructure;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bite.Payment.Api.Features.Balance;

[ApiController]
[Route("api/payments/balance")]
[Authorize]
public class BalanceController : ControllerBase
{
    private readonly PaymentDbContext _db;
    private readonly ICurrentUser _me;
    public BalanceController(PaymentDbContext db, ICurrentUser me) { _db = db; _me = me; }

    public record TopUpRequest(decimal Amount, string StripeToken);

    [HttpGet]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var bal = await _db.Balances.FindAsync([_me.UserId.Value], ct);
        var loyalty = await _db.Loyalty.FindAsync([_me.UserId.Value], ct);
        return Ok(new {
            available = bal?.Available ?? 0,
            held = bal?.Held ?? 0,
            loyaltyPoints = loyalty?.Points ?? 0
        });
    }

    [HttpPost("topup")]
    public async Task<IActionResult> TopUp([FromBody] TopUpRequest req, CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        if (req.Amount <= 0) return BadRequest();
        // Stripe charge skipped for brevity. Production: PaymentIntent + 3DS confirm here.
        var bal = await _db.Balances.FindAsync([_me.UserId.Value], ct)
            ?? new UserBalance { UserId = _me.UserId.Value };
        if (bal.UserId == Guid.Empty) { bal.UserId = _me.UserId.Value; _db.Balances.Add(bal); }
        bal.Available += req.Amount;
        bal.UpdatedAt = DateTime.UtcNow;
        _db.Ledger.Add(new BalanceLedger { UserId = _me.UserId.Value, Amount = req.Amount, Type = "topup", Reference = req.StripeToken });
        await _db.SaveChangesAsync(ct);
        return Ok(new { newBalance = bal.Available });
    }
}

[ApiController]
[Route("api/payments/loyalty")]
[Authorize]
public class LoyaltyController : ControllerBase
{
    private readonly PaymentDbContext _db;
    private readonly IPublishEndpoint _bus;
    private readonly ICurrentUser _me;
    public LoyaltyController(PaymentDbContext db, IPublishEndpoint bus, ICurrentUser me)
    { _db = db; _bus = bus; _me = me; }

    public record CreateBonusItemRequest(Guid RestaurantId, Guid MenuItemId, string Name, int Cost, string? ImageUrl);

    [HttpGet("catalogue/{restaurantId:guid}"), AllowAnonymous]
    public async Task<IActionResult> Catalogue(Guid restaurantId, CancellationToken ct)
        => Ok(await _db.BonusCatalogue.AsNoTracking().Where(b => b.RestaurantId == restaurantId && b.IsActive).ToListAsync(ct));

    [HttpPost("catalogue")]
    public async Task<IActionResult> CreateBonus([FromBody] CreateBonusItemRequest req, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Director, UserRole.Admin)) return Forbid();
        var b = new BonusCatalogueItem
        {
            RestaurantId = req.RestaurantId, MenuItemId = req.MenuItemId,
            Name = req.Name, Cost = req.Cost, ImageUrl = req.ImageUrl
        };
        _db.BonusCatalogue.Add(b);
        await _db.SaveChangesAsync(ct);
        return Ok(b);
    }

    [HttpPost("redeem/{bonusId:guid}")]
    public async Task<IActionResult> Redeem(Guid bonusId, CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var b = await _db.BonusCatalogue.FindAsync([bonusId], ct);
        if (b is null) return NotFound();
        var acc = await _db.Loyalty.FindAsync([_me.UserId.Value], ct);
        if (acc is null || acc.Points < b.Cost) return BadRequest(new { error = "Not enough points" });
        acc.Points -= b.Cost;
        acc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new BuildingBlocks.Contracts.BonusRedeemed(_me.UserId.Value, b.MenuItemId, b.Cost), ct);
        return Ok(new { redeemed = true, remainingPoints = acc.Points });
    }
}
