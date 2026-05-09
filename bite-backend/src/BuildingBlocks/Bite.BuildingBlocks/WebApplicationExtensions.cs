using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Bite.BuildingBlocks.Identity;
using Bite.BuildingBlocks.Middleware;

namespace Bite.BuildingBlocks;

public static class WebApplicationExtensions
{
    /// <summary>
    /// Common middleware pipeline used by every service: correlation id, current user, problem details.
    /// </summary>
    public static WebApplication UseBitePipeline(this WebApplication app)
    {
        app.UseMiddleware<CorrelationIdMiddleware>();
        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapHealthChecks("/health");
        return app;
    }

    public static IServiceCollection AddBiteCommon(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddProblemDetails();
        services.AddHealthChecks();
        return services;
    }
}
