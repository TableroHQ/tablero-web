using Stripe;
using Stripe.Checkout;

namespace Bite.Payment.Api.Services;

public interface IStripeService
{
    Task<Session> CreateCheckoutSessionAsync(decimal amount, string currency, Guid invoiceId, string successUrl, string cancelUrl, CancellationToken ct = default);
    Task<Refund> RefundAsync(string paymentIntentId, decimal amount, string reason, CancellationToken ct = default);
}

public sealed class StripeService : IStripeService
{
    public async Task<Session> CreateCheckoutSessionAsync(decimal amount, string currency, Guid invoiceId,
        string successUrl, string cancelUrl, CancellationToken ct = default)
    {
        var options = new SessionCreateOptions
        {
            Mode = "payment",
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new()
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = currency,
                        UnitAmountDecimal = (long)(amount * 100m),
                        ProductData = new SessionLineItemPriceDataProductDataOptions { Name = $"Bite invoice {invoiceId}" }
                    },
                    Quantity = 1
                }
            },
            Metadata = new Dictionary<string, string> { ["invoiceId"] = invoiceId.ToString() },
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl
        };
        return await new SessionService().CreateAsync(options, cancellationToken: ct);
    }

    public async Task<Refund> RefundAsync(string paymentIntentId, decimal amount, string reason, CancellationToken ct = default)
    {
        var options = new RefundCreateOptions
        {
            PaymentIntent = paymentIntentId,
            Amount = (long)(amount * 100m),
            Reason = "requested_by_customer",
            Metadata = new Dictionary<string, string> { ["reason"] = reason }
        };
        return await new RefundService().CreateAsync(options, cancellationToken: ct);
    }
}
