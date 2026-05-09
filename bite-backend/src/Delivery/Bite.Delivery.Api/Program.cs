using Bite.BuildingBlocks;
using Bite.BuildingBlocks.Auth;
using Bite.BuildingBlocks.Messaging;
using Bite.BuildingBlocks.Telemetry;
using Bite.Delivery.Api.Features.Consumers;
using Bite.Delivery.Api.Hubs;
using Bite.Delivery.Api.Infrastructure;
using Bite.Delivery.Api.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Serilog;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddBiteTelemetry(builder.Configuration, "delivery");
builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddDbContext<DeliveryDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379"));
builder.Services.AddSingleton<IAcceptLockService, AcceptLockService>();

builder.Services.AddSignalR().AddStackExchangeRedis(
    builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379");

builder.Services.AddBiteMassTransit<DeliveryDbContext>(builder.Configuration, x =>
{
    x.AddConsumer<DeliveryOrderReadyConsumer>();
});

builder.Services.AddBiteCommon();
builder.Services.AddBiteJwtAuth(builder.Configuration);

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseBitePipeline();
app.MapControllers();
app.MapHub<CourierHub>("/hubs/courier");

if (app.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DeliveryDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
public partial class Program { }
