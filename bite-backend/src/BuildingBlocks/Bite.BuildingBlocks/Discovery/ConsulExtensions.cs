using Consul;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Bite.BuildingBlocks.Discovery;

public static class ConsulExtensions
{
    public static IServiceCollection AddConsulServiceDiscovery(this IServiceCollection services, IConfiguration config)
    {
        var consulUrl = config.GetConnectionString("Consul") ?? "http://localhost:8500";
        services.AddSingleton<IConsulClient>(_ => new ConsulClient(c => c.Address = new Uri(consulUrl)));
        return services;
    }
}

/// <summary>
/// Registers this service with Consul on startup, deregisters on shutdown.
/// </summary>
public sealed class ConsulRegistrationHostedService : IHostedService
{
    private readonly IConsulClient _consul;
    private readonly IConfiguration _config;
    private readonly IHostApplicationLifetime _lifetime;
    private readonly ILogger<ConsulRegistrationHostedService> _log;
    private string? _registrationId;

    public ConsulRegistrationHostedService(
        IConsulClient consul, IConfiguration config,
        IHostApplicationLifetime lifetime,
        ILogger<ConsulRegistrationHostedService> log)
    {
        _consul = consul; _config = config; _lifetime = lifetime; _log = log;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        var name = _config["Service:Name"] ?? "unknown";
        var host = _config["Service:Host"] ?? Dns.GetHostName();
        var port = int.Parse(_config["Service:Port"] ?? "8080");
        _registrationId = $"{name}-{Guid.NewGuid():N}";

        var reg = new AgentServiceRegistration
        {
            ID = _registrationId,
            Name = name,
            Address = host,
            Port = port,
            Check = new AgentServiceCheck
            {
                HTTP = $"http://{host}:{port}/health",
                Interval = TimeSpan.FromSeconds(15),
                Timeout = TimeSpan.FromSeconds(3),
                DeregisterCriticalServiceAfter = TimeSpan.FromMinutes(1)
            }
        };

        await _consul.Agent.ServiceRegister(reg, ct);
        _log.LogInformation("Registered {Service} with Consul as {Id}", name, _registrationId);
    }

    public async Task StopAsync(CancellationToken ct)
    {
        if (_registrationId is null) return;
        await _consul.Agent.ServiceDeregister(_registrationId, ct);
        _log.LogInformation("Deregistered {Id}", _registrationId);
    }
}

internal static class Dns
{
    public static string GetHostName() => System.Net.Dns.GetHostName();
}
