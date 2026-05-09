using Bite.BuildingBlocks;
using Bite.BuildingBlocks.Auth;
using Bite.BuildingBlocks.Messaging;
using Bite.BuildingBlocks.Telemetry;
using Bite.Identity.Api.Features.Auth;
using Bite.Identity.Api.Infrastructure;
using FluentValidation;
using FluentValidation.AspNetCore;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddBiteTelemetry(builder.Configuration, "identity");
builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddDbContext<IdentityDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddBiteMassTransit<IdentityDbContext>(builder.Configuration);

builder.Services.AddBiteCommon();
builder.Services.AddBiteJwtAuth(builder.Configuration);

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOtpService, OtpService>();

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseBitePipeline();
app.MapControllers();

// Auto-migrate in development
if (app.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
    await db.Database.MigrateAsync();
    await IdentitySeeder.SeedAsync(db, scope.ServiceProvider);
}

app.Run();

public partial class Program { }
