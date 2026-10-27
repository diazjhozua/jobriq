using Jobriq.Application.Applications.CreateApplication;
using Jobriq.Application.Applications.DeleteApplication;
using Jobriq.Application.Applications.SaveGeneratedResume;
using Jobriq.Application.Applications.UpdateApplicationStatus;
using Jobriq.Application.Profiles.ReviewProfile;
using Jobriq.Application.Profiles.SaveProfile;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Application.Resumes.GenerateResume;
using Jobriq.Application.State.GetState;
using Microsoft.Extensions.DependencyInjection;

namespace Jobriq.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<GenerateResumeUseCase>();
        services.AddScoped<ExportResumeUseCase>();
        services.AddScoped<GetStateUseCase>();
        services.AddScoped<SaveProfileUseCase>();
        services.AddScoped<ReviewProfileUseCase>();
        services.AddScoped<CreateApplicationUseCase>();
        services.AddScoped<UpdateApplicationStatusUseCase>();
        services.AddScoped<DeleteApplicationUseCase>();
        services.AddScoped<SaveGeneratedResumeUseCase>();

        return services;
    }
}
