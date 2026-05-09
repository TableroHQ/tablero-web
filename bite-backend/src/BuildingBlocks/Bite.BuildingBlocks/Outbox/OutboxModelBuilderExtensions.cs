using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bite.BuildingBlocks.Outbox;

public static class OutboxModelBuilderExtensions
{
    /// <summary>
    /// Adds outbox + idempotency tables to any DbContext. Call from OnModelCreating.
    /// </summary>
    public static ModelBuilder AddOutboxAndIdempotency(this ModelBuilder mb)
    {
        mb.Entity<OutboxEvent>(e =>
        {
            e.ToTable("outbox_events");
            e.HasKey(x => x.Id);
            e.Property(x => x.AggregateType).HasMaxLength(100).IsRequired();
            e.Property(x => x.EventType).HasMaxLength(100).IsRequired();
            e.Property(x => x.Payload).HasColumnType("jsonb").IsRequired();
            e.Property(x => x.CorrelationId).HasMaxLength(64);
            e.HasIndex(x => x.ProcessedAt);
            e.HasIndex(x => x.CreatedAt);
        });

        mb.Entity<ProcessedMessage>(e =>
        {
            e.ToTable("processed_messages");
            e.HasKey(x => x.MessageId);
            e.Property(x => x.Consumer).HasMaxLength(150).IsRequired();
        });

        return mb;
    }
}
