using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Jobriq.Infrastructure.Persistence.Postgres.Configurations;

internal sealed class ProfileRowConfiguration : IEntityTypeConfiguration<ProfileRow>
{
    public void Configure(EntityTypeBuilder<ProfileRow> builder)
    {
        builder.ToTable("resume_profiles");

        builder.HasKey(row => row.ClientId);

        builder
            .Property(row => row.ProfileJson)
            .HasColumnName("profile")
            .HasColumnType("jsonb")
            .IsRequired();
    }
}
