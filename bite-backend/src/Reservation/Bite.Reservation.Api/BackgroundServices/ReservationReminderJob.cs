using Bite.BuildingBlocks.Contracts;
using Bite.Reservation.Api.Domain;
using Bite.Reservation.Api.Infrastructure;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Bite.Reservation.Api.BackgroundServices;

/// <summary>
/// Every 5 minutes, finds reservations whose slot starts within 24 hours and dispatches
/// reminder events. Notification service consumes them and emails/SMS the user.
/// </summary>
[DisallowConcurrentExecution]
public class ReservationReminderJob : IJob
{
    private readonly ReservationDbContext _db;
    private readonly IPublishEndpoint _bus;
    private readonly ILogger<ReservationReminderJob> _log;

    public ReservationReminderJob(ReservationDbContext db, IPublishEndpoint bus, ILogger<ReservationReminderJob> log)
    {
        _db = db; _bus = bus; _log = log;
    }

    public async Task Execute(IJobExecutionContext ctx)
    {
        var now = DateTime.UtcNow;
        var window = now.AddHours(24);

        var due = await _db.Reservations
            .Where(r => r.Status == ReservationStatus.Confirmed
                     && !r.ReminderSent
                     && r.SlotStart > now && r.SlotStart <= window)
            .Take(200)
            .ToListAsync(ctx.CancellationToken);

        foreach (var r in due)
        {
            await _bus.Publish(new ReservationReminder(r.Id, r.UserId ?? Guid.Empty, r.SlotStart),
                ctx.CancellationToken);
            r.ReminderSent = true;
        }

        if (due.Count > 0)
        {
            await _db.SaveChangesAsync(ctx.CancellationToken);
            _log.LogInformation("Dispatched {Count} reservation reminders", due.Count);
        }
    }
}
