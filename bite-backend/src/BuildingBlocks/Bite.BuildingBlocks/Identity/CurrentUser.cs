using Microsoft.AspNetCore.Http;

namespace Bite.BuildingBlocks.Identity;

/// <summary>
/// Reads the identity headers forwarded by YARP gateway. Inject via DI as scoped service.
/// </summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    UserRole? Role { get; }
    string? Email { get; }
    Guid? RestaurantId { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(params UserRole[] roles);
}

public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;
    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    private string? Header(string key) => _accessor.HttpContext?.Request.Headers[key].ToString();

    public Guid? UserId => Guid.TryParse(Header(IdentityHeaders.UserId), out var v) ? v : null;
    public UserRole? Role => Enum.TryParse<UserRole>(Header(IdentityHeaders.UserRole), true, out var r) ? r : null;
    public string? Email => Header(IdentityHeaders.UserEmail);
    public Guid? RestaurantId => Guid.TryParse(Header(IdentityHeaders.RestaurantId), out var v) ? v : null;
    public bool IsAuthenticated => UserId.HasValue;
    public bool IsInRole(params UserRole[] roles) => Role.HasValue && roles.Contains(Role.Value);
}
