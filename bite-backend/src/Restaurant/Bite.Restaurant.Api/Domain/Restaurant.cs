namespace Bite.Restaurant.Api.Domain;

public class Restaurant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string Timezone { get; set; } = "UTC";
    public TimeOnly OpeningTime { get; set; }
    public TimeOnly ClosingTime { get; set; }
    public Guid OwnerUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Photo> Photos { get; set; } = [];
}

public class Photo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public string Url { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Cached snapshot of public menu, owned by Order&Kitchen service originally.</summary>
public class MenuCacheItem
{
    public Guid Id { get; set; } = Guid.NewGuid();           // matches order_db.menu_items.id
    public Guid RestaurantId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string Allergens { get; set; } = string.Empty;    // CSV
    public bool IsAvailable { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class RatingSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RestaurantId { get; set; }
    public decimal AverageChef { get; set; }
    public decimal AverageWaiter { get; set; }
    public decimal AverageCleanliness { get; set; }
    public decimal AverageService { get; set; }
    public decimal Overall { get; set; }
    public int TotalReviews { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
