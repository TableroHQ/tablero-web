using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Bite.Identity.Api.Domain;
using Microsoft.IdentityModel.Tokens;

namespace Bite.Identity.Api.Features.Auth;

public interface IJwtTokenService
{
    (string token, DateTime expiresAt) IssueAccessToken(User user);
    (string raw, string hash, DateTime expiresAt) IssueRefreshToken();
    string HashRefresh(string raw);
}

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;
    public JwtTokenService(IConfiguration config) => _config = config;

    public (string token, DateTime expiresAt) IssueAccessToken(User user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["SigningKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var minutes = int.Parse(jwt["AccessTokenMinutes"] ?? "15");
        var expires = DateTime.UtcNow.AddMinutes(minutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("username", user.Username),
        };
        if (user.RestaurantId.HasValue)
            claims.Add(new Claim("restaurantId", user.RestaurantId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer:   jwt["Issuer"],
            audience: jwt["Audience"],
            claims:   claims,
            expires:  expires,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public (string raw, string hash, DateTime expiresAt) IssueRefreshToken()
    {
        Span<byte> bytes = stackalloc byte[64];
        RandomNumberGenerator.Fill(bytes);
        var raw = Convert.ToBase64String(bytes);
        var days = int.Parse(_config["Jwt:RefreshTokenDays"] ?? "7");
        return (raw, HashRefresh(raw), DateTime.UtcNow.AddDays(days));
    }

    public string HashRefresh(string raw)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }
}
