using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jobriq.Infrastructure.Persistence.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class AddPromptStyles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "prompt_styles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    client_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    instructions = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prompt_styles", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_prompt_styles_client_created",
                schema: "public",
                table: "prompt_styles",
                columns: new[] { "client_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ux_prompt_styles_client_active",
                schema: "public",
                table: "prompt_styles",
                column: "client_id",
                unique: true,
                filter: "\"is_active\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "prompt_styles",
                schema: "public");
        }
    }
}
