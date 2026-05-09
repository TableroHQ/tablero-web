using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Bite.BuildingBlocks.Messaging;

public static class MassTransitExtensions
{
    /// <summary>
    /// Registers MassTransit with RabbitMQ, EF Core transactional outbox + inbox.
    /// </summary>
    public static IServiceCollection AddBiteMassTransit<TContext>(
        this IServiceCollection services,
        IConfiguration config,
        Action<IBusRegistrationConfigurator>? configure = null)
        where TContext : DbContext
    {
        services.AddMassTransit(x =>
        {
            // EF Core transactional outbox — publishes events written in the same transaction as
            // your business data, with idempotent inbox to deduplicate consumption.
            x.AddEntityFrameworkOutbox<TContext>(o =>
            {
                o.QueryDelay = TimeSpan.FromSeconds(1);
                o.UsePostgres();
                o.UseBusOutbox();
            });

            configure?.Invoke(x);

            x.UsingRabbitMq((ctx, cfg) =>
            {
                var rabbit = config.GetConnectionString("RabbitMq")
                    ?? "amqp://bite:bite@localhost:5672";
                cfg.Host(new Uri(rabbit));

                cfg.UseMessageRetry(r => r.Exponential(
                    retryLimit: 3,
                    minInterval: TimeSpan.FromSeconds(1),
                    maxInterval: TimeSpan.FromSeconds(4),
                    intervalDelta: TimeSpan.FromSeconds(1)));

                cfg.ConfigureEndpoints(ctx);
            });
        });

        return services;
    }
}
