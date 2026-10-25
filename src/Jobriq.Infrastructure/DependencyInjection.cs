using Jobriq.Application.Abstractions;
using Jobriq.Infrastructure.Ai;
using Jobriq.Infrastructure.Export;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Jobriq.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        if (string.Equals(configuration["Ai:Provider"], "Fake", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IResumeAiService, FakeResumeAiService>();
        }
        else
        {
            services.AddSingleton<IResumeAiService, OpenAiResumeAiService>();
        }

        services.AddSingleton<IResumeExporter, MarkdownResumeExporter>();
        services.AddSingleton<IResumeExporter, DocxResumeExporter>();

        return services;
    }
}
