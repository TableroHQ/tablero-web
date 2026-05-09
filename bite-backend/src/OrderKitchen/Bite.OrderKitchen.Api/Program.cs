using Bite.BuildingBlocks;
using Bite.BuildingBlocks.Auth;
using Bite.BuildingBlocks.Messaging;
using Bite.BuildingBlocks.Telemetry;
using Bite.OrderKitchen.Api.Features.Consumers;
using Bite.OrderKitchen.Api.Hubs;
using Bite.OrderKitchen.Api.Infrastructure;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddBiteTelemetry(builder.Configuration, "orderkitchen");
builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddDbContext<OrderDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// SignalR with Redis backplane so multiple instances broadcast in sync.
builder.Services.AddSignalR().AddStackExchangeRedis(
    builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379",
    o => o.Configuration.ChannelPrefix = StackExchange.Redis.RedisChannel.Literal("bite-signalr"));

builder.Services.AddBiteMassTransit<OrderDbContext>(builder.Configuration, x =>
{
    x.AddConsumer<ReservationSeatedConsumer>();
});

builder.Services.AddBiteCommon();
builder.Services.AddBiteJwtAuth(builder.Configuration);

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseBitePipeline();
app.MapControllers();

app.MapHub<KitchenHub>("/hubs/kitchen");
app.MapHub<WaiterHub>("/hubs/waiter");
app.MapHub<TableHub>("/hubs/table");

if (app.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    await db.Database.MigrateAsync();
    await OrderSeeder.SeedAsync(db);
}

app.Run();
public partial class Program { }
