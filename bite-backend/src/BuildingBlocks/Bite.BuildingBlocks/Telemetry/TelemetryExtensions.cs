using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Formatting.Compact;

namespace Bite.BuildingBlocks.Telemetry;

public static class TelemetryExtensions
{
    /// <summary>
    /// Wires Serilog (compact JSON to stdout) + OpenTelemetry traces (OTLP gRPC to Tempo).
    /// </summary>
    public static IServiceCollection AddBiteTelemetry(
        this IServiceCollection services,
        IConfiguration config,
        string serviceName)
    {
        Log.Logger = new LoggerConfiguration()
            .Enrich.FromLogContext()
            .Enrich.WithProperty("service", serviceName)
            .WriteTo.Console(new CompactJsonFormatter())
            .CreateLogger();

        var otlp = config["OpenTelemetry:OtlpEndpoint"] ?? "http://localhost:4317";

        services.AddOpenTelemetry()
            .ConfigureResource(r => r.AddService(serviceName))
            .WithTracing(t => t
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddEntityFrameworkCoreInstrumentation()
                .AddSource("MassTransit")
                .AddOtlpExporter(o => o.Endpoint = new Uri(otlp)));

        return services;
    }
}
