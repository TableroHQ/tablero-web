using System.Text.Json;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Bite.BuildingBlocks.Outbox;

/// <summary>
/// Helper for writing an outbox row in the SAME transaction as your business data.
/// </summary>
public interface IOutboxWriter
{
    Task EnqueueAsync<T>(string aggregateType, Guid aggregateId, T payload,
                         string? correlationId = null, CancellationToken ct = default)
        where T : class;
}

public sealed class OutboxWriter<TContext> : IOutboxWriter where TContext : DbContext
{
    private readonly TContext _db;
    public OutboxWriter(TContext db) => _db = db;

    public async Task EnqueueAsync<T>(string aggregateType, Guid aggregateId, T payload,
                                      string? correlationId = null, CancellationToken ct = default)
        where T : class
    {
        var evt = new OutboxEvent
        {
            AggregateType = aggregateType,
            AggregateId   = aggregateId,
            EventType     = typeof(T).Name,
            Payload       = JsonSerializer.Serialize(payload),
            CorrelationId = correlationId
        };
        await _db.Set<OutboxEvent>().AddAsync(evt, ct);
        // Caller is responsible for SaveChangesAsync — keeps this in the parent transaction.
    }
}
