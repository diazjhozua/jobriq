using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Applications.Create;
using Jobriq.Application.Applications.Delete;
using Jobriq.Application.Applications.GenerateCoverLetter;
using Jobriq.Application.Applications.SaveGeneratedResume;
using Jobriq.Application.Applications.UpdateDetails;
using Jobriq.Application.Applications.UpdateStatus;
using Jobriq.Application.CoverLetters.Export;
using Jobriq.Application.Profiles.GenerateStandaloneResume;
using Jobriq.Application.Profiles.Review;
using Jobriq.Application.Profiles.Save;
using Jobriq.Application.Resumes.Export;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Application.Resumes.Generate;
using Jobriq.Application.State.GetState;
using Jobriq.Contracts;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;

namespace Jobriq.Web.Tests.Contracts;

public sealed class DependencyInjectionTests
{
    [Fact]
    public void AllHandlers_AreResolvable()
    {
        using ContractWebFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IServiceProvider services = scope.ServiceProvider;

        services.GetRequiredService<ICommandHandler<CreateApplicationCommand, ApplicationDto>>();
        services.GetRequiredService<ICommandHandler<UpdateApplicationDetailsCommand, ApplicationDto>>();
        services.GetRequiredService<ICommandHandler<UpdateApplicationStatusCommand, ApplicationDto>>();
        services.GetRequiredService<ICommandHandler<DeleteApplicationCommand>>();
        services.GetRequiredService<ICommandHandler<SaveGeneratedResumeCommand, ApplicationDto>>();
        services.GetRequiredService<ICommandHandler<GenerateCoverLetterCommand, ApplicationDto>>();
        services.GetRequiredService<ICommandHandler<GenerateResumeCommand, GeneratedResumeDto>>();
        services.GetRequiredService<IQueryHandler<ExportResumeQuery, ExportedFile>>();
        services.GetRequiredService<ICommandHandler<GenerateStandaloneResumeCommand, GeneratedResumeDto>>();
        services.GetRequiredService<ICommandHandler<SaveProfileCommand, ProfileDto>>();
        services.GetRequiredService<ICommandHandler<ReviewProfileCommand, ReviewProfileResponse>>();
        services.GetRequiredService<IQueryHandler<GetStateQuery, StateDto>>();
        services.GetRequiredService<IQueryHandler<ExportCoverLetterQuery, ExportedFile>>();

        true.ShouldBeTrue();
    }
}
