using Bite.BuildingBlocks.Outbox;
using Bite.Notification.Api.Domain;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Notification.Api.Infrastructure;

public class NotifyDbContext : DbContext
{
    public NotifyDbContext(DbContextOptions<NotifyDbContext> options) : base(options) { }

    public DbSet<Domain.Notification> Notifications => Set<Domain.Notification>();
    public DbSet<NotificationPreference> Preferences => Set<NotificationPreference>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.AddInboxStateEntity();
        mb.AddOutboxStateEntity();
        mb.AddOutboxMessageEntity();
        mb.AddOutboxAndIdempotency();

        mb.Entity<Domain.Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(40);
            e.Property(x => x.Title).HasMaxLength(200);
            e.Property(x => x.Body).HasMaxLength(1000);
            e.Property(x => x.Metadata).HasColumnType("jsonb");
            e.HasIndex(x => new { x.UserId, x.ReadFlag, x.CreatedAt });
        });

        mb.Entity<NotificationPreference>(e =>
        {
            e.ToTable("notification_preferences");
            e.HasKey(x => x.UserId);
        });

        mb.Entity<Review>(e =>
        {
            e.ToTable("reviews");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Comment).HasMaxLength(2000);
            e.Property(x => x.ModerationReason).HasMaxLength(500);
            e.HasIndex(x => x.RestaurantId);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.Status);
        });
    }
}
