using StackExchange.Redis;

namespace Bite.Reservation.Api.Services;

public interface ISlotLockService
{
    Task<IAsyncDisposable?> AcquireAsync(Guid tableId, DateTime slotStart, TimeSpan? lockTtl = null);
}

/// <summary>
/// Redis-based distributed lock to prevent two clients booking the same slot at the same time.
/// </summary>
public sealed class SlotLockService : ISlotLockService
{
    private readonly IConnectionMultiplexer _mux;
    public SlotLockService(IConnectionMultiplexer mux) => _mux = mux;

    public async Task<IAsyncDisposable?> AcquireAsync(Guid tableId, DateTime slotStart, TimeSpan? lockTtl = null)
    {
        var key = $"slot-lock:{tableId}:{slotStart:yyyyMMddHHmm}";
        var token = Guid.NewGuid().ToString("N");
        var db = _mux.GetDatabase();
        var ok = await db.StringSetAsync(key, token, lockTtl ?? TimeSpan.FromSeconds(20), When.NotExists);
        return ok ? new RedisLock(db, key, token) : null;
    }

    private sealed class RedisLock : IAsyncDisposable
    {
        private readonly IDatabase _db;
        private readonly string _key, _token;
        public RedisLock(IDatabase db, string key, string token) { _db = db; _key = key; _token = token; }

        public async ValueTask DisposeAsync()
        {
            const string lua = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
            await _db.ScriptEvaluateAsync(lua, new RedisKey[] { _key }, new RedisValue[] { _token });
        }
    }
}
