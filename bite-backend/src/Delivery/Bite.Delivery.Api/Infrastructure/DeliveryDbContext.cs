using Bite.BuildingBlocks.Outbox;
using Bite.Delivery.Api.Domain;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Delivery.Api.Infrastructure;

public class DeliveryDbContext : DbContext
{
    public DeliveryDbContext(DbContextOptions<DeliveryDbContext> options) : base(options) { }

    public DbSet<DeliveryOrder> DeliveryOrders => Set<DeliveryOrder>();
    public DbSet<Checkpoint> Checkpoints => Set<Checkpoint>();
    public DbSet<Courier> Couriers => Set<Courier>();
    public DbSet<CourierRating> Ratings => Set<CourierRating>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.AddInboxStateEntity();
        mb.AddOutboxStateEntity();
        mb.AddOutboxMessageEntity();
        mb.AddOutboxAndIdempotency();

        mb.Entity<DeliveryOrder>(e =>
        {
            e.ToTable("delivery_orders");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Address).HasMaxLength(300);
            e.Property(x => x.Payout).HasPrecision(10, 2);
            e.Property(x => x.OrderAmount).HasPrecision(10, 2);
            e.HasMany(x => x.Checkpoints).WithOne().HasForeignKey(c => c.DeliveryOrderId);
            e.HasIndex(x => x.OrderId).IsUnique();
            e.HasIndex(x => new { x.Status, x.RestaurantId });
            e.HasIndex(x => x.CourierId);
        });

        mb.Entity<Checkpoint>(e =>
        {
            e.ToTable("checkpoints");
            e.HasKey(x => x.Id);
            e.Property(x => x.Note).HasMaxLength(200);
        });

        mb.Entity<Courier>(e =>
        {
            e.ToTable("couriers");
            e.HasKey(x => x.Id);
            e.Property(x => x.DisplayName).HasMaxLength(150);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.AverageRating).HasPrecision(3, 2);
        });

        mb.Entity<CourierRating>(e =>
        {
            e.ToTable("courier_ratings");
            e.HasKey(x => x.Id);
            e.Property(x => x.Comment).HasMaxLength(500);
            e.HasIndex(x => x.CourierId);
        });
    }
}
