using Bite.BuildingBlocks.Contracts;
using Bite.Payment.Api.Domain;
using Bite.Payment.Api.Infrastructure;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace Bite.Payment.Api.Features.Webhooks;

[ApiController]
[Route("api/payments/webhook/stripe")]
[AllowAnonymous]
public class StripeWebhookController : ControllerBase
{
    private readonly PaymentDbContext _db;
    private readonly IConfiguration _config;
    private readonly IPublishEndpoint _bus;
    private readonly ILogger<StripeWebhookController> _log;

    public StripeWebhookController(PaymentDbContext db, IConfiguration config,
                                   IPublishEndpoint bus, ILogger<StripeWebhookController> log)
    { _db = db; _config = config; _bus = bus; _log = log; }

    [HttpPost]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(ct);
        var sig = Request.Headers["Stripe-Signature"].ToString();
        var secret = _config["Stripe:WebhookSecret"];

        Event ev;
        try { ev = EventUtility.ConstructEvent(json, sig, secret); }
        catch (StripeException e) { _log.LogWarning(e, "Stripe signature verification failed"); return BadRequest(); }

        switch (ev.Type)
        {
            case "checkout.session.completed":
                if (ev.Data.Object is Stripe.Checkout.Session session)
                    await HandleSessionCompleted(session, ct);
                break;
            case "charge.refunded":
                _log.LogInformation("Charge refunded: {Id}", ev.Id);
                break;
        }
        return Ok();
    }

    private async Task HandleSessionCompleted(Stripe.Checkout.Session session, CancellationToken ct)
    {
        if (!session.Metadata.TryGetValue("invoiceId", out var invIdStr)) return;
        if (!Guid.TryParse(invIdStr, out var invId)) return;
        var inv = await _db.Invoices.FindAsync([invId], ct);
        if (inv is null || inv.Status == InvoiceStatus.Paid) return;
        inv.Status = InvoiceStatus.Paid;
        inv.Method = PaymentMethod.Card;
        inv.PaidAt = DateTime.UtcNow;
        inv.StripePaymentIntentId = session.PaymentIntentId;
        await _bus.Publish(new PaymentSucceeded(inv.Id, inv.OrderId, inv.UserId, inv.Total, "Card"), ct);
        await _db.SaveChangesAsync(ct);
    }
}
