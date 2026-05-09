using System.Security.Cryptography;
using System.Text;
using Bite.Identity.Api.Domain;
using Bite.Identity.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Bite.Identity.Api.Features.Auth;

public interface IOtpService
{
    Task<string> CreateAsync(Guid userId, string purpose, CancellationToken ct = default);
    Task<bool> VerifyAsync(Guid userId, string purpose, string code, CancellationToken ct = default);
}

public sealed class OtpService : IOtpService
{
    private readonly IdentityDbContext _db;
    private readonly IPasswordHasher _hasher;

    public OtpService(IdentityDbContext db, IPasswordHasher hasher)
    {
        _db = db; _hasher = hasher;
    }

    public async Task<string> CreateAsync(Guid userId, string purpose, CancellationToken ct = default)
    {
        // Invalidate previous codes
        var prev = await _db.OtpCodes.Where(o => o.UserId == userId && o.Purpose == purpose && o.ConsumedAt == null).ToListAsync(ct);
        foreach (var p in prev) p.ConsumedAt = DateTime.UtcNow;

        var code = RandomNumberGenerator.GetInt32(100_000, 999_999).ToString();
        _db.OtpCodes.Add(new OtpCode
        {
            UserId = userId,
            CodeHash = _hasher.Hash(code),
            Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });
        await _db.SaveChangesAsync(ct);
        return code;
    }

    public async Task<bool> VerifyAsync(Guid userId, string purpose, string code, CancellationToken ct = default)
    {
        var otp = await _db.OtpCodes
            .Where(o => o.UserId == userId && o.Purpose == purpose && o.ConsumedAt == null && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (otp is null) return false;

        otp.Attempts++;
        if (otp.Attempts > 5)
        {
            otp.ConsumedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return false;
        }

        var ok = _hasher.Verify(code, otp.CodeHash);
        if (ok) otp.ConsumedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ok;
    }
}
