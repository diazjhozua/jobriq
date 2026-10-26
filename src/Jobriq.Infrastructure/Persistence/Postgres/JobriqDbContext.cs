using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;

namespace Jobriq.Infrastructure.Persistence.Postgres;

public sealed class JobriqDbContext(DbContextOptions<JobriqDbContext> options) : DbContext(options)
{
    internal DbSet<ProfileRow> Profiles => Set<ProfileRow>();

    internal DbSet<ApplicationRow> Applications => Set<ApplicationRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProfileRow>();
        modelBuilder.Entity<ApplicationRow>();
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(JobriqDbContext).Assembly);
        modelBuilder.HasDefaultSchema("public");
    }
}
