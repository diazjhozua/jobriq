using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Jobriq.Infrastructure.Persistence.Postgres.Configurations;

internal sealed class ResumeThemeSettingsRowConfiguration : IEntityTypeConfiguration<ResumeThemeSettingsRow>
{
    public void Configure(EntityTypeBuilder<ResumeThemeSettingsRow> builder)
    {
        builder.ToTable("resume_theme_settings");

        builder.HasKey(row => row.ClientId);
    }
}
