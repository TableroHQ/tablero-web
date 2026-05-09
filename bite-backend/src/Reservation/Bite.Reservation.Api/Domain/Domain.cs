namespace Bite.Reservation.Api.Domain;

public enum ReservationStatus { Pending, Confirmed, Seated, Completed, Cancelled, NoShow }

public enum TableZone { Indoor, Terrace, Bar, Outdoor }

public class RestaurantTable
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public string Code { get; set; } = string.Empty;     // e.g. T-07
    public TableZone Zone { get; set; } = TableZone.Indoor;
    public int Seats { get; set; }
    public string? QrCodeUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public Guid? UserId { get; set; }
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }
    public Guid TableId { get; set; }
    public DateTime SlotStart { get; set; }
    public DateTime SlotEnd { get; set; }
    public int PartySize { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? SeatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool ReminderSent { get; set; }

    public List<ReservationPreOrder> PreOrders { get; set; } = [];
}

public class ReservationPreOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReservationId { get; set; }
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Qty { get; set; }
    public string? Modifications { get; set; }
}

/// <summary>Pre-computed open slots per table per day. Keeps booking O(1).</summary>
public class TimeSlot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TableId { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public bool IsBooked { get; set; }
}
