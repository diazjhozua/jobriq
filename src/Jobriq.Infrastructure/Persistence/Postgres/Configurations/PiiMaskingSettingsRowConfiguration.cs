using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Jobriq.Infrastructure.Persistence.Postgres.Configurations;

internal sealed class PiiMaskingSettingsRowConfiguration : IEntityTypeConfiguration<PiiMaskingSettingsRow>
{
    public void Configure(EntityTypeBuilder<PiiMaskingSettingsRow> builder)
    {
        builder.ToTable("pii_masking_settings");

        builder.HasKey(row => row.ClientId);

        builder
            .Property(row => row.Enabled)
            .HasDefaultValue(true)
            .ValueGeneratedNever();
    }
}
