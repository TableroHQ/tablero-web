using Bite.BuildingBlocks.Outbox;
using Bite.Reservation.Api.Domain;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Reservation.Api.Infrastructure;

public class ReservationDbContext : DbContext
{
    public ReservationDbContext(DbContextOptions<ReservationDbContext> options) : base(options) { }

    public DbSet<RestaurantTable> Tables => Set<RestaurantTable>();
    public DbSet<Domain.Reservation> Reservations => Set<Domain.Reservation>();
    public DbSet<ReservationPreOrder> PreOrders => Set<ReservationPreOrder>();
    public DbSet<TimeSlot> Slots => Set<TimeSlot>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.AddInboxStateEntity();
        mb.AddOutboxStateEntity();
        mb.AddOutboxMessageEntity();
        mb.AddOutboxAndIdempotency();

        mb.Entity<RestaurantTable>(e =>
        {
            e.ToTable("tables");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasMaxLength(20);
            e.Property(x => x.Zone).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.QrCodeUrl).HasMaxLength(500);
            e.HasIndex(x => new { x.RestaurantId, x.Code }).IsUnique();
        });

        mb.Entity<Domain.Reservation>(e =>
        {
            e.ToTable("reservations");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.GuestName).HasMaxLength(150);
            e.Property(x => x.GuestPhone).HasMaxLength(30);
            e.Property(x => x.Notes).HasMaxLength(500);
            e.HasMany(x => x.PreOrders).WithOne().HasForeignKey(p => p.ReservationId);
            e.HasIndex(x => new { x.TableId, x.SlotStart, x.Status });
            e.HasIndex(x => x.UserId);
        });

        mb.Entity<ReservationPreOrder>(e =>
        {
            e.ToTable("reservation_pre_orders");
            e.HasKey(x => x.Id);
            e.Property(x => x.MenuItemName).HasMaxLength(150);
            e.Property(x => x.Modifications).HasMaxLength(300);
        });

        mb.Entity<TimeSlot>(e =>
        {
            e.ToTable("time_slots");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TableId, x.Start, x.End }).IsUnique();
        });
    }
}

public static class ReservationSeeder
{
    public static async Task SeedAsync(ReservationDbContext db)
    {
        if (await db.Tables.AnyAsync()) return;
        var rid = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var zones = new[] { TableZone.Indoor, TableZone.Terrace, TableZone.Bar };
        for (var i = 1; i <= 12; i++)
        {
            db.Tables.Add(new RestaurantTable
            {
                RestaurantId = rid,
                Code = $"T-{i:D2}",
                Zone = zones[i % 3],
                Seats = i % 3 == 0 ? 6 : i % 2 == 0 ? 4 : 2
            });
        }
        await db.SaveChangesAsync();
    }
}
