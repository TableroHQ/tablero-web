using StackExchange.Redis;

namespace Bite.Delivery.Api.Services;

public interface IAcceptLockService
{
    /// <summary>
    /// Tries to mark a delivery as "claimed by courier". Returns true if successful, false if another courier already accepted.
    /// </summary>
    Task<bool> TryAcceptAsync(Guid deliveryId, Guid courierId, TimeSpan? ttl = null);
}

public sealed class AcceptLockService : IAcceptLockService
{
    private readonly IConnectionMultiplexer _mux;
    public AcceptLockService(IConnectionMultiplexer mux) => _mux = mux;

    public async Task<bool> TryAcceptAsync(Guid deliveryId, Guid courierId, TimeSpan? ttl = null)
    {
        var key = $"delivery:accept:{deliveryId}";
        return await _mux.GetDatabase().StringSetAsync(key, courierId.ToString(),
            ttl ?? TimeSpan.FromMinutes(5), When.NotExists);
    }
}
