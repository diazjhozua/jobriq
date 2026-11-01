using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Jobriq.Infrastructure.Persistence.Postgres.Configurations;

internal sealed class PromptStyleRowConfiguration : IEntityTypeConfiguration<PromptStyleRow>
{
    public void Configure(EntityTypeBuilder<PromptStyleRow> builder)
    {
        builder.ToTable("prompt_styles");

        builder.HasKey(row => row.Id);

        builder
            .HasIndex(row => new { row.ClientId, row.CreatedAt })
            .HasDatabaseName("ix_prompt_styles_client_created");

        builder
            .HasIndex(row => row.ClientId)
            .HasDatabaseName("ux_prompt_styles_client_active")
            .IsUnique()
            .HasFilter("\"is_active\"");
    }
}
