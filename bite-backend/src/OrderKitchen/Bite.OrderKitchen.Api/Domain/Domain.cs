namespace Bite.OrderKitchen.Api.Domain;

public enum OrderStatus { Pending, InKitchen, Ready, Served, Cancelled }
public enum OrderType { DineIn, Delivery }
public enum OrderItemStatus { Queued, Preparing, Ready, Served }

public class MenuCategory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class MenuItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string Allergens { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public Guid? UserId { get; set; }
    public Guid? TableId { get; set; }
    public Guid? TableSessionId { get; set; }
    public OrderType Type { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public Guid? AssignedWaiterId { get; set; }
    public Guid? AssignedChefId { get; set; }
    public decimal Subtotal { get; set; }
    public decimal ServiceFee { get; set; }
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadyAt { get; set; }
    public DateTime? ServedAt { get; set; }
    public string? Notes { get; set; }

    public List<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Modifications { get; set; }
    public OrderItemStatus Status { get; set; } = OrderItemStatus.Queued;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
