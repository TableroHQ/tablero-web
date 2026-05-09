using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Bite.OrderKitchen.Api.Hubs;

/// <summary>Live kitchen display: chefs in the same restaurant join one group.</summary>
[Authorize]
public class KitchenHub : Hub
{
    public Task JoinRestaurant(Guid restaurantId)
        => Groups.AddToGroupAsync(Context.ConnectionId, $"kitchen:{restaurantId}");

    public Task LeaveRestaurant(Guid restaurantId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, $"kitchen:{restaurantId}");
}

/// <summary>Per-waiter notifications (assigned tables, ready alerts).</summary>
[Authorize]
public class WaiterHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var waiterId = Context.User?.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(waiterId))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"waiter:{waiterId}");
        await base.OnConnectedAsync();
    }
}

/// <summary>Per-table session — guests get live order status updates.</summary>
public class TableHub : Hub
{
    public Task JoinTable(Guid tableSessionId)
        => Groups.AddToGroupAsync(Context.ConnectionId, $"table:{tableSessionId}");
}
