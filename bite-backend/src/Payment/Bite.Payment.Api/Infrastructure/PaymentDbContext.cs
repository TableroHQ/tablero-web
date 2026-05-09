using Bite.BuildingBlocks.Outbox;
using Bite.Payment.Api.Domain;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Payment.Api.Infrastructure;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options) { }

    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<UserBalance> Balances => Set<UserBalance>();
    public DbSet<BalanceLedger> Ledger => Set<BalanceLedger>();
    public DbSet<DeliveryHold> DeliveryHolds => Set<DeliveryHold>();
    public DbSet<LoyaltyAccount> Loyalty => Set<LoyaltyAccount>();
    public DbSet<BonusCatalogueItem> BonusCatalogue => Set<BonusCatalogueItem>();
    public DbSet<LoyaltyConfig> LoyaltyConfigs => Set<LoyaltyConfig>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.AddInboxStateEntity();
        mb.AddOutboxStateEntity();
        mb.AddOutboxMessageEntity();
        mb.AddOutboxAndIdempotency();

        mb.Entity<Invoice>(e =>
        {
            e.ToTable("invoices");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Method).HasConversion<string?>().HasMaxLength(20);
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.Property(x => x.Service).HasPrecision(10, 2);
            e.Property(x => x.Total).HasPrecision(10, 2);
            e.Property(x => x.StripePaymentIntentId).HasMaxLength(100);
            e.Property(x => x.RefundReason).HasMaxLength(500);
            e.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.InvoiceId);
            e.HasIndex(x => x.OrderId);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.Status);
        });

        mb.Entity<InvoiceItem>(e =>
        {
            e.ToTable("invoice_items");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150);
            e.Property(x => x.UnitPrice).HasPrecision(10, 2);
        });

        mb.Entity<UserBalance>(e =>
        {
            e.ToTable("balances");
            e.HasKey(x => x.UserId);
            e.Property(x => x.Available).HasPrecision(10, 2);
            e.Property(x => x.Held).HasPrecision(10, 2);
        });

        mb.Entity<BalanceLedger>(e =>
        {
            e.ToTable("balance_ledger");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasMaxLength(20);
            e.Property(x => x.Reference).HasMaxLength(100);
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.HasIndex(x => x.UserId);
        });

        mb.Entity<DeliveryHold>(e =>
        {
            e.ToTable("delivery_holds");
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.HasIndex(x => x.OrderId);
        });

        mb.Entity<LoyaltyAccount>(e =>
        {
            e.ToTable("loyalty_accounts");
            e.HasKey(x => x.UserId);
        });

        mb.Entity<BonusCatalogueItem>(e =>
        {
            e.ToTable("bonus_catalogue");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
        });

        mb.Entity<LoyaltyConfig>(e =>
        {
            e.ToTable("loyalty_configs");
            e.HasKey(x => x.Id);
            e.Property(x => x.PointsPerDollar).HasPrecision(5, 2);
            e.HasIndex(x => x.RestaurantId).IsUnique();
        });
    }
}

public static class PaymentSeeder
{
    public static async Task SeedAsync(PaymentDbContext db)
    {
        if (await db.LoyaltyConfigs.AnyAsync()) return;
        var rid = Guid.Parse("00000000-0000-0000-0000-000000000001");
        db.LoyaltyConfigs.Add(new LoyaltyConfig { RestaurantId = rid, PointsPerDollar = 1m });
        await db.SaveChangesAsync();
    }
}
