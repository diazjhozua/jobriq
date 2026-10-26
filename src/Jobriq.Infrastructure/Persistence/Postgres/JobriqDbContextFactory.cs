using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Jobriq.Infrastructure.Persistence.Postgres;

internal sealed class JobriqDbContextFactory : IDesignTimeDbContextFactory<JobriqDbContext>
{
    public JobriqDbContext CreateDbContext(string[] args)
    {
        string? connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Database");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Set ConnectionStrings__Database before running EF Core design-time commands.");
        }

        DbContextOptionsBuilder<JobriqDbContext> options = new();
        options
            .UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, "public"))
            .UseSnakeCaseNamingConvention();

        return new JobriqDbContext(options.Options);
    }
}
