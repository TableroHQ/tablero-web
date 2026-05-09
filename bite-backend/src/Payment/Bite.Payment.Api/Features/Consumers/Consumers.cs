using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Outbox;
using Bite.Payment.Api.Domain;
using Bite.Payment.Api.Infrastructure;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Payment.Api.Features.Consumers;

/// <summary>Generates an invoice when an order is ready (dine-in flow).</summary>
public class OrderReadyConsumer : IdempotentConsumer<OrderReady, PaymentDbContext>
{
    private readonly IPublishEndpoint _bus;
    public OrderReadyConsumer(PaymentDbContext db, ILogger<OrderReadyConsumer> log, IPublishEndpoint bus) : base(db, log)
        => _bus = bus;

    protected override async Task HandleAsync(ConsumeContext<OrderReady> ctx)
    {
        // For brevity, skipping detailed lookup of order items via Refit.
        // Full impl: Refit-call OrderKitchen service to fetch the order details.
        var inv = new Invoice
        {
            OrderId = ctx.Message.OrderId,
            RestaurantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Subtotal = 0,
            Service = 0,
            Total = 0,
            Status = InvoiceStatus.Open
        };
        Db.Invoices.Add(inv);
        await _bus.Publish(new InvoiceGenerated(inv.Id, ctx.Message.OrderId, inv.Total), ctx.CancellationToken);
        Logger.LogInformation("Created invoice {InvId} for order {OrderId}", inv.Id, ctx.Message.OrderId);
    }
}

/// <summary>Releases held balance to restaurant on confirmed delivery.</summary>
public class DeliveryConfirmedConsumer : IdempotentConsumer<DeliveryConfirmed, PaymentDbContext>
{
    public DeliveryConfirmedConsumer(PaymentDbContext db, ILogger<DeliveryConfirmedConsumer> log) : base(db, log) { }

    protected override async Task HandleAsync(ConsumeContext<DeliveryConfirmed> ctx)
    {
        var hold = await Db.DeliveryHolds.FirstOrDefaultAsync(h => h.OrderId == ctx.Message.OrderId, ctx.CancellationToken);
        if (hold is null || hold.Released) return;
        var bal = await Db.Balances.FindAsync(new object[] { hold.UserId }, ctx.CancellationToken);
        if (bal is not null)
        {
            bal.Held -= hold.Amount;
            bal.UpdatedAt = DateTime.UtcNow;
        }
        hold.Released = true;
        hold.ReleasedAt = DateTime.UtcNow;
        Db.Ledger.Add(new BalanceLedger
        {
            UserId = hold.UserId,
            Amount = -hold.Amount,
            Type = "release",
            Reference = ctx.Message.OrderId.ToString()
        });
    }
}
