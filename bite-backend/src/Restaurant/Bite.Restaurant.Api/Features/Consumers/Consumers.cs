using Bite.BuildingBlocks.Contracts;
using Bite.BuildingBlocks.Outbox;
using Bite.Restaurant.Api.Domain;
using Bite.Restaurant.Api.Infrastructure;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.Restaurant.Api.Features.Consumers;

/// <summary>Updates aggregate ratings whenever a new review is published.</summary>
public class ReviewSubmittedConsumer : IdempotentConsumer<ReviewSubmitted, RestaurantDbContext>
{
    public ReviewSubmittedConsumer(RestaurantDbContext db, ILogger<ReviewSubmittedConsumer> log) : base(db, log) { }

    protected override async Task HandleAsync(ConsumeContext<ReviewSubmitted> ctx)
    {
        var ev = ctx.Message;
        var snap = await Db.Ratings.FirstOrDefaultAsync(s => s.RestaurantId == ev.RestaurantId, ctx.CancellationToken);
        if (snap is null)
        {
            snap = new RatingSnapshot { RestaurantId = ev.RestaurantId };
            Db.Ratings.Add(snap);
        }

        var n = snap.TotalReviews;
        decimal Roll(decimal current, int next) => (current * n + next) / (n + 1);
        snap.AverageChef        = Roll(snap.AverageChef, ev.ChefRating);
        snap.AverageWaiter      = Roll(snap.AverageWaiter, ev.WaiterRating);
        snap.AverageCleanliness = Roll(snap.AverageCleanliness, ev.CleanlinessRating);
        snap.AverageService     = Roll(snap.AverageService, ev.ServiceRating);
        snap.TotalReviews       = n + 1;
        snap.Overall = (snap.AverageChef + snap.AverageWaiter + snap.AverageCleanliness + snap.AverageService) / 4m;
        snap.UpdatedAt = DateTime.UtcNow;

        Logger.LogInformation("Updated rating snapshot for {RestaurantId}: overall {Overall}", ev.RestaurantId, snap.Overall);
    }
}

/// <summary>Reflects 86'd state in the public menu cache.</summary>
public class MenuItemUnavailableConsumer : IdempotentConsumer<MenuItemUnavailable, RestaurantDbContext>
{
    public MenuItemUnavailableConsumer(RestaurantDbContext db, ILogger<MenuItemUnavailableConsumer> log) : base(db, log) { }

    protected override async Task HandleAsync(ConsumeContext<MenuItemUnavailable> ctx)
    {
        var item = await Db.MenuCache.FirstOrDefaultAsync(m => m.Id == ctx.Message.MenuItemId, ctx.CancellationToken);
        if (item is null) return;
        item.IsAvailable = false;
        item.UpdatedAt = DateTime.UtcNow;
    }
}
