using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Formatting.Compact;
using Yarp.ReverseProxy.Transforms;

var builder = WebApplication.CreateBuilder(args);

// ----- Logging -----
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service", "gateway")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateLogger();
builder.Host.UseSerilog();

// ----- JWT (validates centrally so downstream services never re-validate) -----
var jwt = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwt["SigningKey"]!);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
builder.Services.AddAuthorization();

// ----- YARP -----
builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddTransforms(transformContext =>
    {
        transformContext.AddRequestTransform(async ctx =>
        {
            // After JWT validation, forward identity headers to downstream services.
            var user = ctx.HttpContext.User;
            if (user.Identity?.IsAuthenticated == true)
            {
                ctx.ProxyRequest.Headers.Remove("X-User-Id");
                ctx.ProxyRequest.Headers.Remove("X-User-Role");
                ctx.ProxyRequest.Headers.Remove("X-User-Email");
                ctx.ProxyRequest.Headers.Remove("X-Restaurant-Id");

                var sub  = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue("sub");
                var role = user.FindFirstValue(ClaimTypes.Role) ?? user.FindFirstValue("role");
                var email = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
                var rid  = user.FindFirstValue("restaurantId");

                if (!string.IsNullOrEmpty(sub))   ctx.ProxyRequest.Headers.Add("X-User-Id", sub);
                if (!string.IsNullOrEmpty(role))  ctx.ProxyRequest.Headers.Add("X-User-Role", role);
                if (!string.IsNullOrEmpty(email)) ctx.ProxyRequest.Headers.Add("X-User-Email", email);
                if (!string.IsNullOrEmpty(rid))   ctx.ProxyRequest.Headers.Add("X-Restaurant-Id", rid);
            }

            // Always pass a correlation id forward.
            var corr = ctx.HttpContext.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                ?? Guid.NewGuid().ToString("N");
            ctx.ProxyRequest.Headers.Remove("X-Correlation-Id");
            ctx.ProxyRequest.Headers.Add("X-Correlation-Id", corr);

            await Task.CompletedTask;
        });
    });

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()
    .SetIsOriginAllowed(_ => true)));

builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapReverseProxy();

app.Run();
