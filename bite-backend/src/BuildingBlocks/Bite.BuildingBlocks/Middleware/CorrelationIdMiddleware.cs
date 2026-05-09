using Microsoft.AspNetCore.Http;

namespace Bite.BuildingBlocks.Middleware;

/// <summary>
/// Ensures every request has an X-Correlation-Id header (creates one if missing) and
/// adds it to the response so distributed traces can be stitched together.
/// </summary>
public sealed class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    public CorrelationIdMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext ctx)
    {
        var id = ctx.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                 ?? Guid.NewGuid().ToString("N");

        ctx.Request.Headers["X-Correlation-Id"] = id;
        ctx.Response.OnStarting(() =>
        {
            ctx.Response.Headers["X-Correlation-Id"] = id;
            return Task.CompletedTask;
        });

        await _next(ctx);
    }
}
