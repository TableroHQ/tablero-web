using Bite.BuildingBlocks;
using Bite.BuildingBlocks.Auth;
using Bite.BuildingBlocks.Messaging;
using Bite.BuildingBlocks.Telemetry;
using Bite.Notification.Api.Features.Consumers;
using Bite.Notification.Api.Hubs;
using Bite.Notification.Api.Infrastructure;
using Bite.Notification.Api.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Twilio;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddBiteTelemetry(builder.Configuration, "notification");
builder.Host.UseSerilog();

TwilioClient.Init(
    builder.Configuration["Twilio:AccountSid"],
    builder.Configuration["Twilio:AuthToken"]);

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddDbContext<NotifyDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddSignalR().AddStackExchangeRedis(
    builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379");

builder.Services.AddSingleton<IEmailSender, SendGridEmailSender>();
builder.Services.AddSingleton<ISmsSender, TwilioSmsSender>();
builder.Services.AddScoped<INotificationDispatcher, NotificationDispatcher>();

builder.Services.AddBiteMassTransit<NotifyDbContext>(builder.Configuration, x =>
{
    x.AddConsumer<UserRegisteredConsumer>();
    x.AddConsumer<PasswordResetRequestedConsumer>();
    x.AddConsumer<ReservationConfirmedConsumer>();
    x.AddConsumer<ReservationReminderConsumer>();
    x.AddConsumer<OrderReadyNotificationConsumer>();
    x.AddConsumer<PaymentSucceededConsumer>();
    x.AddConsumer<BonusEarnedConsumer>();
    x.AddConsumer<DeliveryCheckpointConsumer>();
});

builder.Services.AddBiteCommon();
builder.Services.AddBiteJwtAuth(builder.Configuration);

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseBitePipeline();
app.MapControllers();
app.MapHub<NotifyHub>("/hubs/notify");

if (app.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<NotifyDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
public partial class Program { }
