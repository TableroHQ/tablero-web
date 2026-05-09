using Bite.BuildingBlocks.Outbox;
using Bite.OrderKitchen.Api.Domain;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.OrderKitchen.Api.Infrastructure;

public class OrderDbContext : DbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options) { }

    public DbSet<MenuCategory> Categories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.AddInboxStateEntity();
        mb.AddOutboxStateEntity();
        mb.AddOutboxMessageEntity();
        mb.AddOutboxAndIdempotency();

        mb.Entity<MenuCategory>(e =>
        {
            e.ToTable("menu_categories");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(100);
            e.HasIndex(x => x.RestaurantId);
        });

        mb.Entity<MenuItem>(e =>
        {
            e.ToTable("menu_items");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150);
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.Allergens).HasMaxLength(200);
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.HasIndex(x => x.RestaurantId);
            e.HasIndex(x => x.CategoryId);
        });

        mb.Entity<Order>(e =>
        {
            e.ToTable("orders");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.Property(x => x.ServiceFee).HasPrecision(10, 2);
            e.Property(x => x.Total).HasPrecision(10, 2);
            e.Property(x => x.Notes).HasMaxLength(500);
            e.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.OrderId);
            e.HasIndex(x => new { x.RestaurantId, x.Status, x.CreatedAt });
            e.HasIndex(x => x.UserId);
        });

        mb.Entity<OrderItem>(e =>
        {
            e.ToTable("order_items");
            e.HasKey(x => x.Id);
            e.Property(x => x.MenuItemName).HasMaxLength(150);
            e.Property(x => x.Modifications).HasMaxLength(300);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.UnitPrice).HasPrecision(10, 2);
        });
    }
}

public static class OrderSeeder
{
    public static async Task SeedAsync(OrderDbContext db)
    {
        if (await db.MenuItems.AnyAsync()) return;
        var rid = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var mains = new MenuCategory { RestaurantId = rid, Name = "Mains", SortOrder = 1 };
        var starters = new MenuCategory { RestaurantId = rid, Name = "Starters", SortOrder = 0 };
        var desserts = new MenuCategory { RestaurantId = rid, Name = "Desserts", SortOrder = 2 };
        db.Categories.AddRange(mains, starters, desserts);

        db.MenuItems.AddRange(
            new MenuItem { RestaurantId = rid, CategoryId = mains.Id, Name = "Smokehouse Burger",
                Description = "Aged cheddar, smoked aioli, brioche bun, hand-cut fries.",
                Price = 18.5m, Allergens = "gluten,dairy",
                ImageUrl = "https://images.pexels.com/photos/29368033/pexels-photo-29368033.jpeg" },
            new MenuItem { RestaurantId = rid, CategoryId = mains.Id, Name = "Truffle Tagliatelle",
                Description = "Hand-rolled pasta, black truffle, parmesan cream.",
                Price = 24m, Allergens = "gluten,dairy",
                ImageUrl = "https://images.unsplash.com/photo-1611270629569-8b357cb88da9" },
            new MenuItem { RestaurantId = rid, CategoryId = starters.Id, Name = "Garden Buddha Bowl",
                Description = "Roasted veggies, tahini, quinoa, soft herbs.",
                Price = 14.5m, Allergens = "sesame" },
            new MenuItem { RestaurantId = rid, CategoryId = desserts.Id, Name = "Bitter Chocolate Cake",
                Description = "Dark ganache, sea salt, raspberry coulis.",
                Price = 9m, Allergens = "dairy,eggs" }
        );
        await db.SaveChangesAsync();
    }
}
