using Bite.BuildingBlocks;
using Bite.BuildingBlocks.Auth;
using Bite.BuildingBlocks.Messaging;
using Bite.BuildingBlocks.Telemetry;
using Bite.Reservation.Api.BackgroundServices;
using Bite.Reservation.Api.Infrastructure;
using Bite.Reservation.Api.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Quartz;
using Serilog;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddBiteTelemetry(builder.Configuration, "reservation");
builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddDbContext<ReservationDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// Redis (slot lock + idempotency cache)
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379"));
builder.Services.AddSingleton<ISlotLockService, SlotLockService>();

builder.Services.AddBiteMassTransit<ReservationDbContext>(builder.Configuration);
builder.Services.AddBiteCommon();
builder.Services.AddBiteJwtAuth(builder.Configuration);

// Quartz — scans for upcoming reservations every 5 min, dispatches reminder events.
builder.Services.AddQuartz(q =>
{
    var jobKey = new JobKey("ReservationReminderJob");
    q.AddJob<ReservationReminderJob>(o => o.WithIdentity(jobKey));
    q.AddTrigger(t => t.ForJob(jobKey).WithIdentity("ReservationReminderJob-trigger")
        .WithSimpleSchedule(s => s.WithIntervalInMinutes(5).RepeatForever()));
});
builder.Services.AddQuartzHostedService(o => o.WaitForJobsToComplete = true);

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseBitePipeline();
app.MapControllers();

if (app.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ReservationDbContext>();
    await db.Database.MigrateAsync();
    await ReservationSeeder.SeedAsync(db);
}

app.Run();
public partial class Program { }
