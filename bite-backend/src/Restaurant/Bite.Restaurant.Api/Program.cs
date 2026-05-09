using Bite.BuildingBlocks;
using Bite.BuildingBlocks.Auth;
using Bite.BuildingBlocks.Messaging;
using Bite.BuildingBlocks.Telemetry;
using Bite.Restaurant.Api.Features.Consumers;
using Bite.Restaurant.Api.Infrastructure;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddBiteTelemetry(builder.Configuration, "restaurant");
builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddDbContext<RestaurantDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

builder.Services.AddBiteMassTransit<RestaurantDbContext>(builder.Configuration, x =>
{
    x.AddConsumer<ReviewSubmittedConsumer>();
    x.AddConsumer<MenuItemUnavailableConsumer>();
});

builder.Services.AddBiteCommon();
builder.Services.AddBiteJwtAuth(builder.Configuration);

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseBitePipeline();
app.MapControllers();

if (app.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<RestaurantDbContext>();
    await db.Database.MigrateAsync();
    await RestaurantSeeder.SeedAsync(db);
}

app.Run();
public partial class Program { }
