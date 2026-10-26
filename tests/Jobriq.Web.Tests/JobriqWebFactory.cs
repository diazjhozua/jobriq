using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Jobriq.Web.Tests;

internal sealed class JobriqWebFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
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
