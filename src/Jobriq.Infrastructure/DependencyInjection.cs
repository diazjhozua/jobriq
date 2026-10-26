using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Infrastructure.Ai;
using Jobriq.Infrastructure.Export;
using Jobriq.Infrastructure.Persistence.Postgres;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Jobriq.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        bool isTesting = false)
    {
        if (string.Equals(configuration["Ai:Provider"], "Fake", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IResumeAiService, FakeResumeAiService>();
        }
        else
        {
            services.AddSingleton<IResumeAiService, OpenAiResumeAiService>();
        }

        services.AddSingleton<IResumeExporter, MarkdownResumeExporter>();
        services.AddSingleton<IResumeExporter, DocxResumeExporter>();
        services.AddPersistence(configuration, isTesting);

        return services;
    }

    private static IServiceCollection AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration,
        bool isTesting)
    {
        string? connectionString = configuration["ConnectionStrings:Database"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            if (!isTesting)
            {
                throw new InvalidOperationException(
                    "ConnectionStrings:Database is required. Set it with user secrets or the ConnectionStrings__Database environment variable.");
            }

            connectionString = "Host=localhost;Database=jobriq_test";
        }

        services.AddDbContext<JobriqDbContext>(options => options
            .UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, "public"))
            .UseSnakeCaseNamingConvention());

        services.AddScoped<IJobriqRepository, PostgresJobriqRepository>();

        return services;
    }
}
