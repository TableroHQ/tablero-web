using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Bite.BuildingBlocks.Auth;

public static class JwtExtensions
{
    /// <summary>
    /// Adds JWT bearer auth with the same signing key/issuer/audience the Identity Service uses.
    /// Used by the gateway and by services that want to also validate (defense-in-depth).
    /// </summary>
    public static IServiceCollection AddBiteJwtAuth(this IServiceCollection services, IConfiguration config)
    {
        var jwt = config.GetSection("Jwt");
        var key = Encoding.UTF8.GetBytes(jwt["SigningKey"] ?? throw new InvalidOperationException("Jwt:SigningKey missing"));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.RequireHttpsMetadata = false;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt["Issuer"],
                    ValidAudience = jwt["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

        services.AddAuthorization();
        return services;
    }
}
