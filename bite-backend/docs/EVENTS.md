# Event Catalog

All events live in `Bite.BuildingBlocks.Contracts.Events`. They flow through RabbitMQ via MassTransit's transactional outbox.

## Identity

| Event                       | Producer | Consumers                              |
|-----------------------------|----------|----------------------------------------|
| `UserRegistered`            | Identity | Notification (welcome email)           |
| `PasswordResetRequested`    | Identity | Notification (OTP via email/SMS)       |

## Reservation

| Event                     | Producer    | Consumers                                  |
|---------------------------|-------------|--------------------------------------------|
| `ReservationConfirmed`    | Reservation | Notification (push/email confirmation)     |
| `ReservationSeated`       | Reservation | OrderKitchen (creates order from pre-order)|
| `ReservationCancelled`    | Reservation | Notification                               |
| `ReservationCompleted`    | Reservation | Notification (request review)              |
| `ReservationNoShow`       | Reservation | Notification (admin alert)                 |
| `ReservationReminder`     | Reservation (Quartz job, 24h before) | Notification |

## Order & Kitchen

| Event                | Producer     | Consumers                                  |
|----------------------|--------------|--------------------------------------------|
| `OrderPlaced`        | OrderKitchen | Payment (track for invoicing)              |
| `OrderItemReady`     | OrderKitchen | (none — internal only)                     |
| `OrderReady`         | OrderKitchen | Payment (invoice gen for dine-in), Delivery (broadcast for delivery), Notification |
| `OrderServed`        | OrderKitchen | Notification                               |
| `OrderCancelled`     | OrderKitchen | Payment, Notification                      |
| `MenuItemUnavailable`| OrderKitchen | Restaurant (update menu cache)             |

## Payment & Loyalty

| Event                  | Producer | Consumers                              |
|------------------------|----------|----------------------------------------|
| `PaymentSucceeded`     | Payment  | Notification (receipt)                 |
| `PaymentFailed`        | Payment  | Notification                           |
| `CashPaymentRecorded`  | Payment  | (audit only)                           |
| `InvoiceGenerated`     | Payment  | Notification                           |
| `BonusEarned`          | Payment  | Notification                           |
| `BonusRedeemed`        | Payment  | OrderKitchen (free item attached to next order) |

## Delivery

| Event                  | Producer | Consumers                            |
|------------------------|----------|--------------------------------------|
| `DeliveryBroadcast`    | Delivery | Notification (push to couriers)      |
| `DeliveryAssigned`     | Delivery | Notification, OrderKitchen           |
| `DeliveryCheckpoint`   | Delivery | Notification (live update for user)  |
| `DeliveryConfirmed`    | Delivery | Payment (release held funds)         |

## Reviews

| Event             | Producer     | Consumers                       |
|-------------------|--------------|---------------------------------|
| `ReviewSubmitted` | Notification (after admin approval) | Restaurant (update rating snapshot) |

## Patterns

- **Transactional outbox** — every event is written in the same transaction as the business data via `Bite.BuildingBlocks.Outbox.IOutboxWriter` and MassTransit's EF Core outbox (`AddEntityFrameworkOutbox<TContext>`). Background publisher polls every second.
- **Idempotent inbox** — every consumer extends `IdempotentConsumer<TMessage, TContext>` which records `messageId` in `processed_messages` and skips duplicates.
- **Retries** — exponential backoff: 1s → 2s → 4s, then DLQ at `{event-name}.dlq`.
- **Tracing** — every event carries the parent activity context, so a single trace shows the full saga.
