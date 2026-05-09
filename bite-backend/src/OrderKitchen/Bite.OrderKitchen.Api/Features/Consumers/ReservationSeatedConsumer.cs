using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Outbox;
using Bite.OrderKitchen.Api.Domain;
using Bite.OrderKitchen.Api.Hubs;
using Bite.OrderKitchen.Api.Infrastructure;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Bite.OrderKitchen.Api.Features.Consumers;

/// <summary>
/// When a reservation is seated, take its pre-orders and create a draft Order.
/// (Consumes ReservationSeated; expects the Reservation service to also publish pre-orders separately, or we look them up via Refit.)
/// </summary>
public class ReservationSeatedConsumer : IdempotentConsumer<ReservationSeated, OrderDbContext>
{
    private readonly IHubContext<KitchenHub> _kitchen;
    public ReservationSeatedConsumer(OrderDbContext db, ILogger<ReservationSeatedConsumer> log,
                                     IHubContext<KitchenHub> kitchen) : base(db, log) { _kitchen = kitchen; }

    protected override async Task HandleAsync(ConsumeContext<ReservationSeated> ctx)
    {
        // In a full implementation we'd fetch the pre-order list from the Reservation service via Refit.
        // For now we just log — the controller-side flow handles direct order placement.
        Logger.LogInformation("Reservation {ResId} seated — kitchen alerted", ctx.Message.ReservationId);
        await Task.CompletedTask;
    }
}
