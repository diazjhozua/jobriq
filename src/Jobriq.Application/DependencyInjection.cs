using Jobriq.Application.Applications.CreateApplication;
using Jobriq.Application.Applications.DeleteApplication;
using Jobriq.Application.Applications.SaveGeneratedResume;
using Jobriq.Application.Applications.UpdateApplicationDetails;
using Jobriq.Application.Applications.UpdateApplicationStatus;
using Jobriq.Application.CoverLetters.ExportCoverLetter;
using Jobriq.Application.CoverLetters.GenerateCoverLetter;
using Jobriq.Application.Profiles.GenerateStandaloneResume;
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
        services.AddScoped<GenerateStandaloneResumeUseCase>();
        services.AddScoped<CreateApplicationUseCase>();
        services.AddScoped<UpdateApplicationDetailsUseCase>();
        services.AddScoped<UpdateApplicationStatusUseCase>();
        services.AddScoped<DeleteApplicationUseCase>();
        services.AddScoped<SaveGeneratedResumeUseCase>();
        services.AddScoped<GenerateCoverLetterUseCase>();
        services.AddScoped<ExportCoverLetterUseCase>();

        return services;
    }
}
