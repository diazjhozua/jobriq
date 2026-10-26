using Jobriq.Application.Abstractions.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Jobriq.Web.Tests;

internal sealed class JobriqWebFactory : WebApplicationFactory<Program>
{
    private static readonly string WebRootPath = CreateWebRoot();

    public InMemoryJobriqRepository Repository { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseWebRoot(WebRootPath);
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Ai:Provider"] = "Fake",
                ["ConnectionStrings:Database"] = "Host=localhost;Database=jobriq_test",
                ["OpenAI:ApiKey"] = string.Empty,
                ["OPENAI_API_KEY"] = string.Empty
            });
        });
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IJobriqRepository>();
            services.AddSingleton<IJobriqRepository>(Repository);
        });
    }

    private static string CreateWebRoot()
    {
        string path = Path.Combine(
            Path.GetTempPath(),
            "jobriq-web-tests",
            Guid.NewGuid().ToString("N"));

        Directory.CreateDirectory(path);
        File.WriteAllText(
            Path.Combine(path, "index.html"),
            "<!doctype html><html><body>jobriq</body></html>");

        return path;
    }
}

internal sealed class MissingKeyWebFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");
        builder.UseSetting("ConnectionStrings:Database", "Host=localhost;Database=jobriq_test");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Ai:Provider"] = "OpenAI",
                ["ConnectionStrings:Database"] = "Host=localhost;Database=jobriq_test",
                ["OpenAI:ApiKey"] = string.Empty,
                ["OPENAI_API_KEY"] = string.Empty
            });
        });
    }
}
