using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;

namespace Jobriq.Infrastructure.Persistence.Postgres;

public sealed class JobriqDbContext(DbContextOptions<JobriqDbContext> options) : DbContext(options)
{
    internal DbSet<ProfileRow> Profiles => Set<ProfileRow>();

    internal DbSet<ApplicationRow> Applications => Set<ApplicationRow>();

    internal DbSet<PromptStyleRow> PromptStyles => Set<PromptStyleRow>();

    internal DbSet<ResumeThemeRow> ResumeThemes => Set<ResumeThemeRow>();

    internal DbSet<ResumeThemeSettingsRow> ResumeThemeSettings => Set<ResumeThemeSettingsRow>();

    internal DbSet<PiiMaskingSettingsRow> PiiMaskingSettings => Set<PiiMaskingSettingsRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProfileRow>();
        modelBuilder.Entity<ApplicationRow>();
        modelBuilder.Entity<PromptStyleRow>();
        modelBuilder.Entity<ResumeThemeRow>();
        modelBuilder.Entity<ResumeThemeSettingsRow>();
        modelBuilder.Entity<PiiMaskingSettingsRow>();
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(JobriqDbContext).Assembly);
        modelBuilder.HasDefaultSchema("public");
    }
}
