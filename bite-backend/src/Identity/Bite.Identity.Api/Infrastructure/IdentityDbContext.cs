using Bite.BuildingBlocks.Outbox;
using Bite.Identity.Api.Domain;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Identity.Api.Infrastructure;

public class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // MassTransit transactional outbox tables (inbox, outbox, outbox_state).
        mb.AddInboxStateEntity();
        mb.AddOutboxStateEntity();
        mb.AddOutboxMessageEntity();

        mb.AddOutboxAndIdempotency();

        mb.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).HasMaxLength(255).IsRequired();
            e.Property(x => x.Username).HasMaxLength(50).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(150);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.AvatarUrl).HasMaxLength(500);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Username).IsUnique();
        });

        mb.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.HasKey(x => x.Id);
            e.Property(x => x.TokenHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.UserAgent).HasMaxLength(300);
            e.Property(x => x.Ip).HasMaxLength(45);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.TokenHash);
        });

        mb.Entity<OtpCode>(e =>
        {
            e.ToTable("otp_codes");
            e.HasKey(x => x.Id);
            e.Property(x => x.CodeHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.Purpose).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.UserId, x.Purpose });
        });
    }
}
