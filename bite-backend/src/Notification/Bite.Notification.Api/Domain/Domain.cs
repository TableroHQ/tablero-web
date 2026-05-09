namespace Bite.Notification.Api.Domain;

public enum NotificationType
{
    UserRegistered, PasswordReset, ReservationConfirmed, ReservationReminder,
    OrderReady, PaymentSucceeded, BonusEarned, DeliveryCheckpoint, Promotion, Generic
}

public enum ReviewStatus { Pending, Published, Rejected, Removed }

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Metadata { get; set; }    // JSON
    public bool ReadFlag { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
}

public class NotificationPreference
{
    public Guid UserId { get; set; }
    public bool EmailEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
    public bool MarketingEnabled { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public Guid RestaurantId { get; set; }
    public Guid? OrderId { get; set; }
    public Guid? ReservationId { get; set; }
    public int ChefRating { get; set; }
    public int WaiterRating { get; set; }
    public int CleanlinessRating { get; set; }
    public int ServiceRating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public ReviewStatus Status { get; set; } = ReviewStatus.Pending;
    public string? ModerationReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public Guid? ModeratorId { get; set; }
}
