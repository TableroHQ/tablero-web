using Bite.BuildingBlocks.Outbox;
using Bite.Restaurant.Api.Domain;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Restaurant.Api.Infrastructure;

public class RestaurantDbContext : DbContext
{
    public RestaurantDbContext(DbContextOptions<RestaurantDbContext> options) : base(options) { }

    public DbSet<Domain.Restaurant> Restaurants => Set<Domain.Restaurant>();
    public DbSet<Photo> Photos => Set<Photo>();
    public DbSet<MenuCacheItem> MenuCache => Set<MenuCacheItem>();
    public DbSet<RatingSnapshot> Ratings => Set<RatingSnapshot>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.AddInboxStateEntity();
        mb.AddOutboxStateEntity();
        mb.AddOutboxMessageEntity();
        mb.AddOutboxAndIdempotency();

        mb.Entity<Domain.Restaurant>(e =>
        {
            e.ToTable("restaurants");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Address).HasMaxLength(300);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.Timezone).HasMaxLength(50);
            e.HasMany(x => x.Photos).WithOne().HasForeignKey(p => p.RestaurantId);
        });

        mb.Entity<Photo>(e =>
        {
            e.ToTable("photos");
            e.HasKey(x => x.Id);
            e.Property(x => x.Url).HasMaxLength(500).IsRequired();
        });

        mb.Entity<MenuCacheItem>(e =>
        {
            e.ToTable("menu_cache");
            e.HasKey(x => x.Id);
            e.Property(x => x.Category).HasMaxLength(50);
            e.Property(x => x.Name).HasMaxLength(150);
            e.Property(x => x.Allergens).HasMaxLength(200);
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.HasIndex(x => x.RestaurantId);
        });

        mb.Entity<RatingSnapshot>(e =>
        {
            e.ToTable("rating_snapshots");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.RestaurantId).IsUnique();
            e.Property(x => x.AverageChef).HasPrecision(3, 2);
            e.Property(x => x.AverageWaiter).HasPrecision(3, 2);
            e.Property(x => x.AverageCleanliness).HasPrecision(3, 2);
            e.Property(x => x.AverageService).HasPrecision(3, 2);
            e.Property(x => x.Overall).HasPrecision(3, 2);
        });
    }
}

public static class RestaurantSeeder
{
    public static async Task SeedAsync(RestaurantDbContext db)
    {
        if (await db.Restaurants.AnyAsync()) return;

        db.Restaurants.Add(new Domain.Restaurant
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "Bite · Downtown",
            Address = "12 Birch Lane",
            Phone = "+1 415 555 0184",
            Description = "A short menu, made well.",
            CoverImageUrl = "https://images.pexels.com/photos/35505245/pexels-photo-35505245.jpeg",
            Timezone = "America/Los_Angeles",
            OpeningTime = new TimeOnly(11, 0),
            ClosingTime = new TimeOnly(23, 0),
            OwnerUserId = Guid.Empty
        });

        await db.SaveChangesAsync();
    }
}
