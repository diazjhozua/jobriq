using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jobriq.Infrastructure.Persistence.Postgres.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationAppliedDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "applied_date",
                schema: "public",
                table: "job_applications",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "applied_date",
                schema: "public",
                table: "job_applications");
        }
    }
}
