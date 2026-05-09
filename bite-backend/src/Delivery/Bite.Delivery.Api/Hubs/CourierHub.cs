using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Bite.Delivery.Api.Hubs;

[Authorize]
public class CourierHub : Hub
{
    public Task JoinCity(Guid restaurantId)
        => Groups.AddToGroupAsync(Context.ConnectionId, $"couriers:{restaurantId}");

    public override async Task OnConnectedAsync()
    {
        var courierId = Context.User?.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(courierId))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"courier:{courierId}");
        await base.OnConnectedAsync();
    }
}
