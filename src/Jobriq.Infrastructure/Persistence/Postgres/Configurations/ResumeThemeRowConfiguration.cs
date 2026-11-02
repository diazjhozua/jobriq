using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Jobriq.Infrastructure.Persistence.Postgres.Configurations;

internal sealed class ResumeThemeRowConfiguration : IEntityTypeConfiguration<ResumeThemeRow>
{
    public void Configure(EntityTypeBuilder<ResumeThemeRow> builder)
    {
        builder.ToTable("resume_themes");

        builder.HasKey(row => row.Id);

        builder
            .Property(row => row.StylesJson)
            .HasColumnName("styles")
            .HasColumnType("jsonb");

        builder
            .HasIndex(row => new { row.ClientId, row.CreatedAt })
            .HasDatabaseName("ix_resume_themes_client_created");
    }
}
