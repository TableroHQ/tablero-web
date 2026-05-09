namespace Bite.Delivery.Api.Domain;

public enum DeliveryStatus { PendingPickup, Available, Assigned, EnRoute, Arrived, Delivered, Confirmed, Failed }

public class DeliveryOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid UserId { get; set; }
    public Guid RestaurantId { get; set; }
    public string Address { get; set; } = string.Empty;
    public double DestLat { get; set; }
    public double DestLng { get; set; }
    public decimal Payout { get; set; }
    public decimal OrderAmount { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.PendingPickup;
    public Guid? CourierId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AssignedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }

    public List<Checkpoint> Checkpoints { get; set; } = [];
}

public class Checkpoint
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DeliveryOrderId { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? Note { get; set; }
    public DateTime At { get; set; } = DateTime.UtcNow;
}

public class Courier
{
    public Guid Id { get; set; }   // matches identity.users.id
    public string DisplayName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsOnline { get; set; }
    public Guid? CurrentRestaurantId { get; set; }
    public int TotalDeliveries { get; set; }
    public decimal AverageRating { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class CourierRating
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DeliveryOrderId { get; set; }
    public Guid CourierId { get; set; }
    public Guid UserId { get; set; }
    public int Stars { get; set; }
    public string? Comment { get; set; }
    public DateTime At { get; set; } = DateTime.UtcNow;
}
