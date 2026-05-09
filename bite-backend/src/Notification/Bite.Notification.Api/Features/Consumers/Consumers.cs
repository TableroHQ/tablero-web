using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Outbox;
using Bite.Notification.Api.Domain;
using Bite.Notification.Api.Infrastructure;
using Bite.Notification.Api.Services;
using MassTransit;

namespace Bite.Notification.Api.Features.Consumers;

// Each consumer fans out in-app + email/SMS based on user prefs.

public class UserRegisteredConsumer : IdempotentConsumer<UserRegistered, NotifyDbContext>
{
    private readonly INotificationDispatcher _d;
    public UserRegisteredConsumer(NotifyDbContext db, ILogger<UserRegisteredConsumer> log, INotificationDispatcher d) : base(db, log) => _d = d;

    protected override Task HandleAsync(ConsumeContext<UserRegistered> ctx)
        => _d.DispatchAsync(ctx.Message.UserId, NotificationType.UserRegistered,
            "Welcome to Bite",
            "Your account is ready. Next time you visit any of our branches, just sign in.",
            email: ctx.Message.Email, ct: ctx.CancellationToken);
}

public class PasswordResetRequestedConsumer : IdempotentConsumer<PasswordResetRequested, NotifyDbContext>
{
    private readonly INotificationDispatcher _d;
    public PasswordResetRequestedConsumer(NotifyDbContext db, ILogger<PasswordResetRequestedConsumer> log, INotificationDispatcher d) : base(db, log) => _d = d;

    protected override Task HandleAsync(ConsumeContext<PasswordResetRequested> ctx)
        => _d.DispatchAsync(ctx.Message.UserId, NotificationType.PasswordReset,
            "Your Bite reset code",
            $"Your code is <strong>{ctx.Message.OtpCode}</strong>. It expires in 10 minutes.",
            email: ctx.Message.Email, ct: ctx.CancellationToken);
}

public class ReservationConfirmedConsumer : IdempotentConsumer<ReservationConfirmed, NotifyDbContext>
{
    private readonly INotificationDispatcher _d;
    public ReservationConfirmedConsumer(NotifyDbContext db, ILogger<ReservationConfirmedConsumer> log, INotificationDispatcher d) : base(db, log) => _d = d;

    protected override Task HandleAsync(ConsumeContext<ReservationConfirmed> ctx)
        => _d.DispatchAsync(ctx.Message.UserId, NotificationType.ReservationConfirmed,
            "Reservation confirmed",
            $"Table booked for {ctx.Message.SlotStart:f}, party of {ctx.Message.PartySize}. See you then.",
            metadata: ctx.Message, ct: ctx.CancellationToken);
}

public class ReservationReminderConsumer : IdempotentConsumer<ReservationReminder, NotifyDbContext>
{
    private readonly INotificationDispatcher _d;
    public ReservationReminderConsumer(NotifyDbContext db, ILogger<ReservationReminderConsumer> log, INotificationDispatcher d) : base(db, log) => _d = d;

    protected override Task HandleAsync(ConsumeContext<ReservationReminder> ctx)
        => _d.DispatchAsync(ctx.Message.UserId, NotificationType.ReservationReminder,
            "Reservation tomorrow",
            $"Quick reminder — your table at Bite is set for {ctx.Message.SlotStart:f}.",
            metadata: ctx.Message, ct: ctx.CancellationToken);
}

public class OrderReadyNotificationConsumer : IdempotentConsumer<OrderReady, NotifyDbContext>
{
    private readonly INotificationDispatcher _d;
    public OrderReadyNotificationConsumer(NotifyDbContext db, ILogger<OrderReadyNotificationConsumer> log, INotificationDispatcher d) : base(db, log) => _d = d;

    protected override async Task HandleAsync(ConsumeContext<OrderReady> ctx)
    {
        // Only push to user when delivery; dine-in is handled by waiter alert.
        if (!string.Equals(ctx.Message.Type, "Delivery", StringComparison.OrdinalIgnoreCase)) return;
        await _d.DispatchAsync(Guid.Empty, NotificationType.OrderReady,
            "Order packed and on its way",
            "Your courier just picked up your order. Live tracking now available.",
            metadata: ctx.Message, ct: ctx.CancellationToken);
    }
}

public class PaymentSucceededConsumer : IdempotentConsumer<PaymentSucceeded, NotifyDbContext>
{
    private readonly INotificationDispatcher _d;
    public PaymentSucceededConsumer(NotifyDbContext db, ILogger<PaymentSucceededConsumer> log, INotificationDispatcher d) : base(db, log) => _d = d;

    protected override Task HandleAsync(ConsumeContext<PaymentSucceeded> ctx)
        => _d.DispatchAsync(ctx.Message.UserId ?? Guid.Empty, NotificationType.PaymentSucceeded,
            "Payment received",
            $"${ctx.Message.Amount:F2} paid via {ctx.Message.Method}. Thanks!",
            metadata: ctx.Message, ct: ctx.CancellationToken);
}

public class BonusEarnedConsumer : IdempotentConsumer<BonusEarned, NotifyDbContext>
{
    private readonly INotificationDispatcher _d;
    public BonusEarnedConsumer(NotifyDbContext db, ILogger<BonusEarnedConsumer> log, INotificationDispatcher d) : base(db, log) => _d = d;

    protected override Task HandleAsync(ConsumeContext<BonusEarned> ctx)
        => _d.DispatchAsync(ctx.Message.UserId, NotificationType.BonusEarned,
            $"+{ctx.Message.Points} points",
            "You earned points on your last visit — keep going for free food.",
            metadata: ctx.Message, ct: ctx.CancellationToken);
}

public class DeliveryCheckpointConsumer : IdempotentConsumer<DeliveryCheckpoint, NotifyDbContext>
{
    private readonly INotificationDispatcher _d;
    public DeliveryCheckpointConsumer(NotifyDbContext db, ILogger<DeliveryCheckpointConsumer> log, INotificationDispatcher d) : base(db, log) => _d = d;

    protected override Task HandleAsync(ConsumeContext<DeliveryCheckpoint> ctx)
        => _d.DispatchAsync(Guid.Empty, NotificationType.DeliveryCheckpoint,
            "Courier update",
            "Your courier just hit a checkpoint — keep an eye on the live map.",
            metadata: ctx.Message, ct: ctx.CancellationToken);
}
