using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Application.Resumes.GenerateResume;
using Microsoft.Extensions.DependencyInjection;

namespace Jobriq.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<GenerateResumeUseCase>();
        services.AddScoped<ExportResumeUseCase>();

        return services;
    }
}
