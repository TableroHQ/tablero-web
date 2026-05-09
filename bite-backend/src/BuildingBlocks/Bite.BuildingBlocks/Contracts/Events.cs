namespace Bite.BuildingBlocks.Contracts;

// =================== USER / IDENTITY ===================
public record UserRegistered(Guid UserId, string Email, string Username, string Role, DateTime At);
public record PasswordResetRequested(Guid UserId, string Email, string OtpCode, DateTime ExpiresAt);

// =================== RESERVATION ===================
public record ReservationConfirmed(Guid ReservationId, Guid UserId, Guid RestaurantId, Guid TableId,
    DateTime SlotStart, int PartySize);
public record ReservationSeated(Guid ReservationId, Guid TableSessionId, DateTime SeatedAt);
public record ReservationCancelled(Guid ReservationId, string Reason);
public record ReservationCompleted(Guid ReservationId, DateTime CompletedAt);
public record ReservationNoShow(Guid ReservationId);
public record ReservationReminder(Guid ReservationId, Guid UserId, DateTime SlotStart);

// =================== ORDER / KITCHEN ===================
public record OrderPlaced(Guid OrderId, Guid? TableSessionId, Guid? UserId, Guid RestaurantId,
    decimal Total, string Type);
public record OrderItemReady(Guid OrderId, Guid OrderItemId, string ItemName);
public record OrderReady(Guid OrderId, Guid? TableId, string Type);
public record OrderServed(Guid OrderId, DateTime ServedAt);
public record OrderCancelled(Guid OrderId, string Reason);
public record MenuItemUnavailable(Guid MenuItemId, Guid RestaurantId);

// =================== PAYMENT / LOYALTY ===================
public record PaymentSucceeded(Guid InvoiceId, Guid? OrderId, Guid? UserId,
    decimal Amount, string Method);
public record PaymentFailed(Guid InvoiceId, string Reason);
public record CashPaymentRecorded(Guid InvoiceId, Guid CashierId, decimal Amount);
public record InvoiceGenerated(Guid InvoiceId, Guid OrderId, decimal Total);
public record BonusEarned(Guid UserId, int Points);
public record BonusRedeemed(Guid UserId, Guid MenuItemId, int Points);

// =================== DELIVERY ===================
public record DeliveryBroadcast(Guid DeliveryId, Guid OrderId, decimal Payout, string Address);
public record DeliveryAssigned(Guid DeliveryId, Guid CourierId);
public record DeliveryCheckpoint(Guid DeliveryId, double Lat, double Lng, DateTime At);
public record DeliveryConfirmed(Guid DeliveryId, Guid OrderId, DateTime At);

// =================== REVIEWS ===================
public record ReviewSubmitted(Guid ReviewId, Guid? UserId, Guid RestaurantId,
    int ChefRating, int WaiterRating, int CleanlinessRating, int ServiceRating, string Comment);
