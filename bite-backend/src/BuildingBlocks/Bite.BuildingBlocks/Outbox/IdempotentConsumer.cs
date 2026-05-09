using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Bite.BuildingBlocks.Outbox;

/// <summary>
/// Base class for event consumers that need exactly-once handling. Records each messageId
/// in processed_messages — duplicate deliveries become no-ops.
/// </summary>
public abstract class IdempotentConsumer<TMessage, TContext> : IConsumer<TMessage>
    where TMessage : class
    where TContext : DbContext
{
    protected readonly TContext Db;
    protected readonly ILogger Logger;

    protected IdempotentConsumer(TContext db, ILogger logger)
    {
        Db = db;
        Logger = logger;
    }

    public async Task Consume(ConsumeContext<TMessage> ctx)
    {
        var messageId = ctx.MessageId ?? Guid.NewGuid();
        var consumerName = GetType().FullName ?? GetType().Name;

        var processed = await Db.Set<ProcessedMessage>()
            .AnyAsync(p => p.MessageId == messageId, ctx.CancellationToken);

        if (processed)
        {
            Logger.LogDebug("Skipping duplicate {MessageId} for {Consumer}", messageId, consumerName);
            return;
        }

        await using var tx = await Db.Database.BeginTransactionAsync(ctx.CancellationToken);
        try
        {
            await HandleAsync(ctx);
            Db.Set<ProcessedMessage>().Add(new ProcessedMessage
            {
                MessageId = messageId,
                Consumer = consumerName
            });
            await Db.SaveChangesAsync(ctx.CancellationToken);
            await tx.CommitAsync(ctx.CancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(ctx.CancellationToken);
            throw;
        }
    }

    protected abstract Task HandleAsync(ConsumeContext<TMessage> ctx);
}
