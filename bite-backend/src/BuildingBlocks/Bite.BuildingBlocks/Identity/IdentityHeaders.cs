namespace Bite.BuildingBlocks.Identity;

/// <summary>
/// Standard identity headers forwarded by the YARP gateway after central JWT validation.
/// Downstream services NEVER parse JWTs — they just read these headers.
/// </summary>
public static class IdentityHeaders
{
    public const string UserId       = "X-User-Id";
    public const string UserRole     = "X-User-Role";
    public const string UserEmail    = "X-User-Email";
    public const string RestaurantId = "X-Restaurant-Id";
    public const string CorrelationId = "X-Correlation-Id";
}

public enum UserRole
{
    Guest, User, Waiter, Chef, Cashier, Courier, Admin, Director
}
