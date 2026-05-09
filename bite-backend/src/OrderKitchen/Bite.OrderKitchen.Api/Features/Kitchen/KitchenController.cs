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

namespace Bite.OrderKitchen.Api.Features.Kitchen;

[ApiController]
[Route("api/kitchen")]
[Authorize]
public class KitchenController : ControllerBase
{
    private readonly OrderDbContext _db;
    private readonly IPublishEndpoint _bus;
    private readonly IHubContext<KitchenHub> _kitchen;
    private readonly IHubContext<WaiterHub> _waiter;
    private readonly IHubContext<TableHub> _table;
    private readonly ICurrentUser _me;

    public KitchenController(OrderDbContext db, IPublishEndpoint bus,
                             IHubContext<KitchenHub> kitchen,
                             IHubContext<WaiterHub> waiter,
                             IHubContext<TableHub> table,
                             ICurrentUser me)
    { _db = db; _bus = bus; _kitchen = kitchen; _waiter = waiter; _table = table; _me = me; }

    public record TicketDto(Guid OrderId, Guid? TableId, OrderType Type, OrderStatus Status,
                            DateTime CreatedAt, IEnumerable<TicketItem> Items);
    public record TicketItem(Guid Id, string Name, int Qty, string? Modifications, OrderItemStatus Status);

    [HttpGet("tickets")]
    public async Task<ActionResult<IEnumerable<TicketDto>>> Tickets([FromQuery] Guid restaurantId, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Chef, UserRole.Admin)) return Forbid();
        var orders = await _db.Orders.Include(o => o.Items)
            .Where(o => o.RestaurantId == restaurantId
                     && (o.Status == OrderStatus.Pending || o.Status == OrderStatus.InKitchen || o.Status == OrderStatus.Ready))
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(ct);
        return Ok(orders.Select(o => new TicketDto(o.Id, o.TableId, o.Type, o.Status, o.CreatedAt,
            o.Items.Select(i => new TicketItem(i.Id, i.MenuItemName, i.Qty, i.Modifications, i.Status)))));
    }

    [HttpPost("items/{itemId:guid}/status")]
    public async Task<IActionResult> UpdateItem(Guid itemId, [FromQuery] OrderItemStatus status, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Chef, UserRole.Admin)) return Forbid();
        var item = await _db.OrderItems.FindAsync([itemId], ct);
        if (item is null) return NotFound();
        item.Status = status;
        item.UpdatedAt = DateTime.UtcNow;

        var order = await _db.Orders.Include(o => o.Items).FirstAsync(o => o.Id == item.OrderId, ct);

        // If item ready, push event
        if (status == OrderItemStatus.Ready)
            await _bus.Publish(new OrderItemReady(order.Id, item.Id, item.MenuItemName), ct);

        // If all items ready, transition order
        if (order.Items.All(i => i.Status is OrderItemStatus.Ready or OrderItemStatus.Served))
        {
            order.Status = OrderStatus.Ready;
            order.ReadyAt = DateTime.UtcNow;
            await _bus.Publish(new OrderReady(order.Id, order.TableId, order.Type.ToString()), ct);

            // Notify waiter and table
            if (order.AssignedWaiterId.HasValue)
                await _waiter.Clients.Group($"waiter:{order.AssignedWaiterId}").SendAsync("order:ready", new { order.Id, order.TableId }, ct);
            if (order.TableSessionId.HasValue)
                await _table.Clients.Group($"table:{order.TableSessionId}").SendAsync("order:status", new { order.Id, status = "READY" }, ct);
        }
        else if (order.Status == OrderStatus.Pending && order.Items.Any(i => i.Status == OrderItemStatus.Preparing))
        {
            order.Status = OrderStatus.InKitchen;
        }

        await _db.SaveChangesAsync(ct);

        // Live KDS update
        await _kitchen.Clients.Group($"kitchen:{order.RestaurantId}").SendAsync("item:status", new { order.Id, itemId, status = status.ToString() }, ct);
        return Ok(new { status });
    }

    [HttpPost("orders/{orderId:guid}/served")]
    public async Task<IActionResult> Served(Guid orderId, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Waiter, UserRole.Admin)) return Forbid();
        var order = await _db.Orders.FindAsync([orderId], ct);
        if (order is null) return NotFound();
        order.Status = OrderStatus.Served;
        order.ServedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _bus.Publish(new OrderServed(orderId, order.ServedAt!.Value), ct);
        return NoContent();
    }

    [HttpPost("call-waiter")]
    public async Task<IActionResult> CallWaiter([FromQuery] Guid waiterId, [FromQuery] Guid orderId, CancellationToken ct)
    {
        if (!_me.IsInRole(UserRole.Chef, UserRole.Admin)) return Forbid();
        await _waiter.Clients.Group($"waiter:{waiterId}").SendAsync("kitchen:call", new { orderId, calledBy = _me.UserId }, ct);
        return NoContent();
    }
}
