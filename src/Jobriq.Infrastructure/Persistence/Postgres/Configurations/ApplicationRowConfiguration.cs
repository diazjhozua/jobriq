using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Jobriq.Infrastructure.Persistence.Postgres.Configurations;

internal sealed class ApplicationRowConfiguration : IEntityTypeConfiguration<ApplicationRow>
{
    public void Configure(EntityTypeBuilder<ApplicationRow> builder)
    {
        builder.ToTable("job_applications", table =>
            table.HasCheckConstraint(
                "ck_job_applications_status",
                "status IN ('Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected')"));

        builder.HasKey(row => row.Id);

        builder
            .Property(row => row.GeneratedResumeJson)
            .HasColumnName("generated_resume")
            .HasColumnType("jsonb");

        builder
            .Property(row => row.CoverLetterJson)
            .HasColumnName("cover_letter")
            .HasColumnType("jsonb");

        builder
            .HasIndex(row => new { row.ClientId, row.CreatedAt })
            .HasDatabaseName("ix_job_applications_client_created")
            .IsDescending(false, true);
    }
}
