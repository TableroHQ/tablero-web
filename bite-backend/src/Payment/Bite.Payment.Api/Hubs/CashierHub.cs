using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Bite.Payment.Api.Hubs;

[Authorize]
public class CashierHub : Hub
{
    public Task JoinRestaurant(Guid restaurantId)
        => Groups.AddToGroupAsync(Context.ConnectionId, $"cashier:{restaurantId}");
}
