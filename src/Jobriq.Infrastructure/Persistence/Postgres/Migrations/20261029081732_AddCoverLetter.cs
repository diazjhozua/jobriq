using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jobriq.Infrastructure.Persistence.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class AddCoverLetter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cover_letter",
                schema: "public",
                table: "job_applications",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cover_letter",
                schema: "public",
                table: "job_applications");
        }
    }
}
