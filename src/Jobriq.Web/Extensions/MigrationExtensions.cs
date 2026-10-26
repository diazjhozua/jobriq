using Jobriq.Infrastructure.Persistence.Postgres;
using Microsoft.EntityFrameworkCore;

namespace Jobriq.Web.Extensions;

public static class MigrationExtensions
{
    public static void ApplyMigrations(this WebApplication app)
    {
        if (!app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
        {
            return;
        }

        using IServiceScope scope = app.Services.CreateScope();
        JobriqDbContext context = scope.ServiceProvider.GetRequiredService<JobriqDbContext>();
        context.Database.Migrate();
    }
}
