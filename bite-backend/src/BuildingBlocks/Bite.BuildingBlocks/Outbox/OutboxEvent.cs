namespace Bite.BuildingBlocks.Outbox;

/// <summary>
/// Outbox row written in the same EF Core transaction as business data.
/// MassTransit's transactional outbox publisher reads pending rows and pushes to RabbitMQ.
/// </summary>
public class OutboxEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string AggregateType { get; set; } = string.Empty;
    public Guid AggregateId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;        // JSON
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public string? CorrelationId { get; set; }
}

/// <summary>
/// Records consumed messageIds for idempotent consumption.
/// </summary>
public class ProcessedMessage
{
    public Guid MessageId { get; set; }
    public string Consumer { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}
