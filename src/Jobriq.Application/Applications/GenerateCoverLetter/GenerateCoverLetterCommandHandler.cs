using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Abstractions.PiiMasking;
using Jobriq.Application.Abstractions.PromptStyles;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.CoverLetters.Generate;
using Jobriq.Application.PiiMasking;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.Domain.PiiMasking;
using Jobriq.Domain.PromptStyles;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Applications.GenerateCoverLetter;

internal sealed class GenerateCoverLetterCommandHandler(
    IResumeAiService aiService,
    IJobriqRepository repository,
    IClientContext clientContext,
    IPromptStyleResolver promptStyleResolver,
    IPiiMaskingSettingsResolver piiMaskingSettingsResolver,
    TimeProvider timeProvider)
    : ICommandHandler<GenerateCoverLetterCommand, ApplicationDto>
{
    public async Task<Result<ApplicationDto>> Handle(
        GenerateCoverLetterCommand command,
        CancellationToken cancellationToken)
    {
        aiService.EnsureAvailable();

        JobApplication application = await repository.GetApplicationAsync(
                clientContext.ClientId,
                command.ApplicationId,
                cancellationToken)
            ?? throw new JobriqResourceNotFoundException("application", command.ApplicationId);

        ResumeProfile profile = await repository.GetProfileAsync(
            clientContext.ClientId,
            cancellationToken);

        CoverLetterNormalizer.EnsureCanGenerate(profile);

        PromptStyleDefinition style = await promptStyleResolver.ResolveAsync(cancellationToken);

        PiiMaskingSettings masking = await piiMaskingSettingsResolver.ResolveAsync(
            cancellationToken);

        ResumeProfile aiProfile = ProfileRedactor.Redact(profile, masking);

        CoverLetterDraft draft = await aiService.GenerateCoverLetterAsync(
            aiProfile,
            application.Company,
            application.Role,
            application.JobDescription,
            style,
            cancellationToken);

        CoverLetter letter = CoverLetterNormalizer.Normalize(
            draft,
            profile,
            application.Company,
            application.Role,
            timeProvider.GetUtcNow());

        JobApplication saved = await repository.SaveCoverLetterAsync(
                clientContext.ClientId,
                command.ApplicationId,
                letter,
                cancellationToken)
            ?? throw new JobriqResourceNotFoundException("application", command.ApplicationId);

        return ApplicationMappings.ToDto(saved);
    }
}
