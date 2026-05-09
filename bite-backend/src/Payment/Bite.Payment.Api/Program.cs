using Bite.BuildingBlocks;
using Bite.BuildingBlocks.Auth;
using Bite.BuildingBlocks.Messaging;
using Bite.BuildingBlocks.Telemetry;
using Bite.Payment.Api.Features.Consumers;
using Bite.Payment.Api.Hubs;
using Bite.Payment.Api.Infrastructure;
using Bite.Payment.Api.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Stripe;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddBiteTelemetry(builder.Configuration, "payment");
builder.Host.UseSerilog();

StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddDbContext<PaymentDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddSignalR().AddStackExchangeRedis(
    builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379");

builder.Services.AddSingleton<IStripeService, StripeService>();

builder.Services.AddBiteMassTransit<PaymentDbContext>(builder.Configuration, x =>
{
    x.AddConsumer<OrderReadyConsumer>();
    x.AddConsumer<DeliveryConfirmedConsumer>();
});

builder.Services.AddBiteCommon();
builder.Services.AddBiteJwtAuth(builder.Configuration);

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseBitePipeline();
app.MapControllers();
app.MapHub<CashierHub>("/hubs/cashier");

if (app.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
    await db.Database.MigrateAsync();
    await PaymentSeeder.SeedAsync(db);
}

app.Run();
public partial class Program { }
