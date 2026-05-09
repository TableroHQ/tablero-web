using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Outbox;
using Bite.Delivery.Api.Domain;
using Bite.Delivery.Api.Hubs;
using Bite.Delivery.Api.Infrastructure;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace Bite.Delivery.Api.Features.Consumers;

/// <summary>
/// When an order with type=Delivery becomes ready, broadcast it to nearby couriers.
/// </summary>
public class DeliveryOrderReadyConsumer : IdempotentConsumer<OrderReady, DeliveryDbContext>
{
    private readonly IPublishEndpoint _bus;
    private readonly IHubContext<CourierHub> _hub;
    public DeliveryOrderReadyConsumer(DeliveryDbContext db, ILogger<DeliveryOrderReadyConsumer> log,
                                      IPublishEndpoint bus, IHubContext<CourierHub> hub) : base(db, log)
    { _bus = bus; _hub = hub; }

    protected override async Task HandleAsync(ConsumeContext<OrderReady> ctx)
    {
        if (!string.Equals(ctx.Message.Type, "Delivery", StringComparison.OrdinalIgnoreCase))
            return;

        // In real impl: load address + payout from order via Refit. For brevity, stub it.
        var d = new DeliveryOrder
        {
            OrderId = ctx.Message.OrderId,
            UserId = Guid.Empty,                  // populated from order detail
            RestaurantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Address = "TBD",
            Status = DeliveryStatus.Available,
            Payout = 6.50m,
            OrderAmount = 0m
        };
        Db.DeliveryOrders.Add(d);

        await _bus.Publish(new DeliveryBroadcast(d.Id, d.OrderId, d.Payout, d.Address), ctx.CancellationToken);
        await _hub.Clients.Group($"couriers:{d.RestaurantId}")
            .SendAsync("delivery:broadcast", new { d.Id, d.Payout, d.Address }, ctx.CancellationToken);
        Logger.LogInformation("Broadcast delivery {Id} to couriers", d.Id);
    }
}
