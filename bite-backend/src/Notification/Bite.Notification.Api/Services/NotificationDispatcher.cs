using System.Text.Json;
using Bite.Notification.Api.Domain;
using Bite.Notification.Api.Hubs;
using Bite.Notification.Api.Infrastructure;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Bite.Notification.Api.Services;

/// <summary>
/// Single fan-out helper: persists a notification, respects user preferences, then dispatches across channels.
/// </summary>
public interface INotificationDispatcher
{
    Task DispatchAsync(Guid userId, NotificationType type, string title, string body,
        object? metadata = null, string? email = null, string? phone = null,
        CancellationToken ct = default);
}

public sealed class NotificationDispatcher : INotificationDispatcher
{
    private readonly NotifyDbContext _db;
    private readonly IEmailSender _email;
    private readonly ISmsSender _sms;
    private readonly IHubContext<NotifyHub> _hub;

    public NotificationDispatcher(NotifyDbContext db, IEmailSender email, ISmsSender sms, IHubContext<NotifyHub> hub)
    { _db = db; _email = email; _sms = sms; _hub = hub; }

    public async Task DispatchAsync(Guid userId, NotificationType type, string title, string body,
        object? metadata = null, string? email = null, string? phone = null, CancellationToken ct = default)
    {
        var prefs = await _db.Preferences.FindAsync(new object[] { userId }, ct)
            ?? new NotificationPreference { UserId = userId };

        var n = new Domain.Notification
        {
            UserId = userId, Type = type, Title = title, Body = body,
            Metadata = metadata is null ? null : JsonSerializer.Serialize(metadata)
        };
        _db.Notifications.Add(n);
        await _db.SaveChangesAsync(ct);

        // Push (in-app)
        if (prefs.PushEnabled)
            await _hub.Clients.Group($"user:{userId}").SendAsync("notify",
                new { n.Id, type = type.ToString(), n.Title, n.Body, n.Metadata, at = n.CreatedAt }, ct);

        // Email
        if (prefs.EmailEnabled && !string.IsNullOrEmpty(email))
            await _email.SendAsync(email, title, RenderHtml(title, body), ct);

        // SMS — only for high-priority types
        var smsWorthy = type is NotificationType.PasswordReset or NotificationType.ReservationReminder
                            or NotificationType.OrderReady or NotificationType.DeliveryCheckpoint;
        if (prefs.SmsEnabled && smsWorthy && !string.IsNullOrEmpty(phone))
            await _sms.SendAsync(phone, $"{title} — {body}", ct);
    }

    private static string RenderHtml(string title, string body)
        => $"<div style='font-family:sans-serif;max-width:560px;margin:auto;padding:32px'>" +
           $"<h1 style='color:#C8553D'>{title}</h1>" +
           $"<p style='color:#444;line-height:1.6'>{body}</p>" +
           $"<p style='color:#999;font-size:12px;margin-top:48px'>Sent by Bite — your restaurant operating system.</p>" +
           $"</div>";
}
