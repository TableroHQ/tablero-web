namespace Bite.Payment.Api.Domain;

public enum InvoiceStatus { Open, Paid, Refunded, Cancelled, Failed }
public enum PaymentMethod { Card, Cash, Balance, Mixed }

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid? UserId { get; set; }
    public Guid RestaurantId { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Service { get; set; }
    public decimal Total { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Open;
    public PaymentMethod? Method { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string? CashierUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? RefundReason { get; set; }
    public List<InvoiceItem> Items { get; set; } = [];
}

public class InvoiceItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Qty { get; set; }
    public decimal UnitPrice { get; set; }
}

public class UserBalance
{
    public Guid UserId { get; set; }
    public decimal Available { get; set; }
    public decimal Held { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class BalanceLedger
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public decimal Amount { get; set; }                       // positive=credit, negative=debit
    public string Type { get; set; } = string.Empty;          // topup | hold | release | refund | payment
    public string? Reference { get; set; }
    public DateTime At { get; set; } = DateTime.UtcNow;
}

public class DeliveryHold
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid UserId { get; set; }
    public decimal Amount { get; set; }
    public bool Released { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReleasedAt { get; set; }
}

public class LoyaltyAccount
{
    public Guid UserId { get; set; }
    public int Points { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class BonusCatalogueItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public Guid MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Cost { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

public class LoyaltyConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public decimal PointsPerDollar { get; set; } = 1m;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
