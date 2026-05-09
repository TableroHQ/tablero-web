using Bite.BuildingBlocks.Identity;
using Bite.Identity.Api.Domain;
using Bite.Identity.Api.Features.Auth;
using Microsoft.EntityFrameworkCore;

namespace Bite.Identity.Api.Infrastructure;

/// <summary>
/// Idempotent dev seeding — never runs in production.
/// </summary>
public static class IdentitySeeder
{
    public static async Task SeedAsync(IdentityDbContext db, IServiceProvider sp)
    {
        if (await db.Users.AnyAsync()) return;

        var hasher = sp.GetRequiredService<IPasswordHasher>();

        var seed = new[]
        {
            ("admin@bite.com",   "admin",   UserRole.Admin),
            ("director@bite.com","director",UserRole.Director),
            ("chef@bite.com",    "chef",    UserRole.Chef),
            ("waiter@bite.com",  "waiter",  UserRole.Waiter),
            ("cashier@bite.com", "cashier", UserRole.Cashier),
            ("courier@bite.com", "courier", UserRole.Courier),
            ("sofia@bite.com",   "sofia",   UserRole.User),
        };

        foreach (var (email, username, role) in seed)
        {
            db.Users.Add(new User
            {
                Email = email,
                Username = username,
                FullName = char.ToUpper(username[0]) + username[1..],
                PasswordHash = hasher.Hash("Password123!"),
                Role = role,
                RestaurantId = role is UserRole.User or UserRole.Guest
                    ? null
                    : Guid.Parse("00000000-0000-0000-0000-000000000001")
            });
        }

        await db.SaveChangesAsync();
    }
}
