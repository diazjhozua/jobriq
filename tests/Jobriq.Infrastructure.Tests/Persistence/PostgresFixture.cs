using Jobriq.Infrastructure.Persistence.Postgres;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace Jobriq.Infrastructure.Tests.Persistence;

public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer container = new PostgreSqlBuilder("postgres:18-alpine")
        .WithDatabase("jobriq")
        .WithUsername("jobriq")
        .WithPassword("jobriq")
        .Build();

    public async Task InitializeAsync()
    {
        await container.StartAsync();

        await using JobriqDbContext context = CreateContext();
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await container.DisposeAsync();
    }

    public JobriqDbContext CreateContext()
    {
        DbContextOptions<JobriqDbContext> options = new DbContextOptionsBuilder<JobriqDbContext>()
            .UseNpgsql(container.GetConnectionString())
            .UseSnakeCaseNamingConvention()
            .Options;

        return new JobriqDbContext(options);
    }
}
