using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Identity;
using Bite.BuildingBlocks.Outbox;
using Bite.Identity.Api.Domain;
using Bite.Identity.Api.Infrastructure;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Identity.Api.Features.Auth;

public record RegisterRequest(string Email, string Username, string Password, string? FullName, string? Phone);
public record LoginRequest(string Identifier, string Password);  // identifier = email OR username
public record RefreshRequest(string RefreshToken);
public record ForgotPasswordRequest(string Email);
public record VerifyOtpRequest(string Email, string Code);
public record ResetPasswordRequest(string Email, string Code, string NewPassword);

public record AuthResponse(string AccessToken, DateTime AccessExpiresAt, string RefreshToken, DateTime RefreshExpiresAt);

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest req, string? ip, string? ua, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(string refresh, string? ip, string? ua, CancellationToken ct = default);
    Task LogoutAsync(string refresh, CancellationToken ct = default);
    Task<string> ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct = default);
    Task<bool> VerifyOtpAsync(VerifyOtpRequest req, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordRequest req, CancellationToken ct = default);
}

public sealed class AuthService : IAuthService
{
    private readonly IdentityDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IOtpService _otp;
    private readonly IPublishEndpoint _bus;
    private readonly ILogger<AuthService> _log;

    public AuthService(IdentityDbContext db, IPasswordHasher hasher, IJwtTokenService jwt,
                       IOtpService otp, IPublishEndpoint bus, ILogger<AuthService> log)
    {
        _db = db; _hasher = hasher; _jwt = jwt; _otp = otp; _bus = bus; _log = log;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email || u.Username == req.Username, ct))
            throw new InvalidOperationException("Email or username is already taken");

        var user = new User
        {
            Email = req.Email.ToLowerInvariant(),
            Username = req.Username,
            FullName = req.FullName,
            Phone = req.Phone,
            PasswordHash = _hasher.Hash(req.Password),
            Role = UserRole.User
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        await _bus.Publish(new UserRegistered(user.Id, user.Email, user.Username, user.Role.ToString(), user.CreatedAt), ct);

        return await IssuePairAsync(user, null, null, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req, string? ip, string? ua, CancellationToken ct = default)
    {
        var isEmail = req.Identifier.Contains('@');
        var user = isEmail
            ? await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Identifier.ToLowerInvariant(), ct)
            : await _db.Users.FirstOrDefaultAsync(u => u.Username == req.Identifier, ct);

        if (user is null || user.IsSuspended) throw new UnauthorizedAccessException("Invalid credentials");
        if (!_hasher.Verify(req.Password, user.PasswordHash)) throw new UnauthorizedAccessException("Invalid credentials");

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return await IssuePairAsync(user, ip, ua, ct);
    }

    public async Task<AuthResponse> RefreshAsync(string refresh, string? ip, string? ua, CancellationToken ct = default)
    {
        var hash = _jwt.HashRefresh(refresh);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct)
            ?? throw new UnauthorizedAccessException("Invalid refresh token");

        if (!token.IsActive) throw new UnauthorizedAccessException("Refresh token is no longer valid");

        var user = await _db.Users.FirstAsync(u => u.Id == token.UserId, ct);

        // rotate
        token.RevokedAt = DateTime.UtcNow;
        var pair = await IssuePairAsync(user, ip, ua, ct);
        token.ReplacedBy = pair.RefreshToken;
        await _db.SaveChangesAsync(ct);
        return pair;
    }

    public async Task LogoutAsync(string refresh, CancellationToken ct = default)
    {
        var hash = _jwt.HashRefresh(refresh);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is { RevokedAt: null })
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<string> ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLowerInvariant(), ct);
        if (user is null)
        {
            // Do not leak whether email exists. Return a fake delay.
            _log.LogInformation("Password reset requested for unknown email {Email}", req.Email);
            return "00000000";
        }

        var code = await _otp.CreateAsync(user.Id, "password_reset", ct);
        await _bus.Publish(new PasswordResetRequested(user.Id, user.Email, code, DateTime.UtcNow.AddMinutes(10)), ct);
        return code; // returned in dev only, in prod this should NOT be returned
    }

    public async Task<bool> VerifyOtpAsync(VerifyOtpRequest req, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLowerInvariant(), ct);
        if (user is null) return false;
        return await _otp.VerifyAsync(user.Id, "password_reset", req.Code, ct);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest req, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLowerInvariant(), ct)
            ?? throw new UnauthorizedAccessException("Invalid request");

        var ok = await _otp.VerifyAsync(user.Id, "password_reset", req.Code, ct);
        if (!ok) throw new UnauthorizedAccessException("Invalid or expired code");

        user.PasswordHash = _hasher.Hash(req.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        // Revoke ALL refresh tokens — security best practice.
        var tokens = await _db.RefreshTokens.Where(t => t.UserId == user.Id && t.RevokedAt == null).ToListAsync(ct);
        foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private async Task<AuthResponse> IssuePairAsync(User user, string? ip, string? ua, CancellationToken ct)
    {
        var (access, accessExp) = _jwt.IssueAccessToken(user);
        var (raw, hash, refreshExp) = _jwt.IssueRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id, TokenHash = hash, ExpiresAt = refreshExp,
            Ip = ip, UserAgent = ua
        });
        await _db.SaveChangesAsync(ct);
        return new AuthResponse(access, accessExp, raw, refreshExp);
    }
}
