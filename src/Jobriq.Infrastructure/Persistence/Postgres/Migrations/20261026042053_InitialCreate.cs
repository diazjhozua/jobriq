using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jobriq.Infrastructure.Persistence.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "job_applications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    client_id = table.Column<Guid>(type: "uuid", nullable: false),
                    company = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    job_description = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    generated_resume = table.Column<string>(type: "jsonb", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_applications", x => x.id);
                    table.CheckConstraint("ck_job_applications_status", "status IN ('Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected')");
                });

            migrationBuilder.CreateTable(
                name: "resume_profiles",
                schema: "public",
                columns: table => new
                {
                    client_id = table.Column<Guid>(type: "uuid", nullable: false),
                    profile = table.Column<string>(type: "jsonb", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_resume_profiles", x => x.client_id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_job_applications_client_created",
                schema: "public",
                table: "job_applications",
                columns: new[] { "client_id", "created_at" },
                descending: new[] { false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "job_applications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "resume_profiles",
                schema: "public");
        }
    }
}
