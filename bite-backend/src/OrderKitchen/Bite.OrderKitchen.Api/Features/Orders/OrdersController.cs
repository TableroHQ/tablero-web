using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Identity;
using Bite.OrderKitchen.Api.Domain;
using Bite.OrderKitchen.Api.Hubs;
using Bite.OrderKitchen.Api.Infrastructure;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Bite.OrderKitchen.Api.Features.Orders;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly IPublishEndpoint _bus;
    private readonly IHubContext<KitchenHub> _kitchen;
    private readonly IHubContext<TableHub> _table;
    private readonly IHubContext<WaiterHub> _waiter;
    private readonly ICurrentUser _me;

    public OrdersController(OrderDbContext db, IPublishEndpoint bus,
                            IHubContext<KitchenHub> kitchen,
                            IHubContext<TableHub> table,
                            IHubContext<WaiterHub> waiter,
                            ICurrentUser me)
    {
        _db = db; _bus = bus; _kitchen = kitchen; _table = table; _waiter = waiter; _me = me;
    }

    public record PlaceOrderRequest(Guid RestaurantId, Guid? TableId, Guid? TableSessionId,
        OrderType Type, IEnumerable<PlaceOrderItem> Items, string? Notes);
    public record PlaceOrderItem(Guid MenuItemId, int Qty, string? Modifications);

    [HttpPost]
    public async Task<IActionResult> Place([FromBody] PlaceOrderRequest req, CancellationToken ct)
    {
        var menuLookup = await _db.MenuItems
            .Where(m => m.RestaurantId == req.RestaurantId &&
                        req.Items.Select(i => i.MenuItemId).Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, ct);

        var unavailable = req.Items.FirstOrDefault(i => !menuLookup.TryGetValue(i.MenuItemId, out var m) || !m.IsAvailable);
        if (unavailable is not null) return BadRequest(new { error = $"Menu item {unavailable.MenuItemId} is not available" });

        var order = new Order
        {
            RestaurantId = req.RestaurantId,
            UserId = _me.UserId,
            TableId = req.TableId,
            TableSessionId = req.TableSessionId,
            Type = req.Type,
            Notes = req.Notes,
            Status = OrderStatus.Pending
        };

        foreach (var i in req.Items)
        {
            var m = menuLookup[i.MenuItemId];
            order.Items.Add(new OrderItem
            {
                MenuItemId = m.Id, MenuItemName = m.Name,
                Qty = i.Qty, UnitPrice = m.Price, Modifications = i.Modifications
            });
        }
        order.Subtotal = order.Items.Sum(i => i.UnitPrice * i.Qty);
        order.ServiceFee = req.Type == OrderType.DineIn ? Math.Round(order.Subtotal * 0.15m, 2) : 0m;
        order.Total = order.Subtotal + order.ServiceFee;

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        // Publish OrderPlaced via outbox
        await _bus.Publish(new OrderPlaced(order.Id, order.TableSessionId, order.UserId,
            order.RestaurantId, order.Total, order.Type.ToString()), ct);

        // Real-time push to kitchen + table
        await _kitchen.Clients.Group($"kitchen:{order.RestaurantId}").SendAsync("order:new", new
        {
            order.Id, order.TableId, order.Type, items = order.Items.Select(i => new { i.Id, i.MenuItemName, i.Qty, i.Modifications, status = i.Status.ToString() })
        }, ct);
        if (order.TableSessionId.HasValue)
            await _table.Clients.Group($"table:{order.TableSessionId}").SendAsync("order:status", new { order.Id, status = "PENDING" }, ct);

        return CreatedAtAction(nameof(Get), new { id = order.Id }, new { order.Id, order.Status, order.Total });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var o = await _db.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id, ct);
        return o is null ? NotFound() : Ok(o);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        if (_me.UserId is null) return Unauthorized();
        var orders = await _db.Orders.AsNoTracking()
            .Where(o => o.UserId == _me.UserId).OrderByDescending(o => o.CreatedAt).Take(50).ToListAsync(ct);
        return Ok(orders);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromQuery] string? reason, CancellationToken ct)
    {
        var o = await _db.Orders.FindAsync([id], ct);
        if (o is null) return NotFound();
        if (o.Status is OrderStatus.Served or OrderStatus.Cancelled) return BadRequest();
        o.Status = OrderStatus.Cancelled;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new OrderCancelled(id, reason ?? ""), ct);
        return NoContent();
    }
}
