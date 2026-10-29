using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.CoverLetters.GenerateCoverLetter;

public sealed class GenerateCoverLetterUseCase(
    IResumeAiService aiService,
    IJobriqRepository repository,
    IClientContext clientContext,
    TimeProvider timeProvider)
{
    public async Task<JobApplication> ExecuteAsync(
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        aiService.EnsureAvailable();

        JobApplication application = await repository.GetApplicationAsync(
                clientContext.ClientId,
                applicationId,
                cancellationToken)
            ?? throw new JobriqResourceNotFoundException("application", applicationId);

        ResumeProfile profile = await repository.GetProfileAsync(clientContext.ClientId, cancellationToken);
        CoverLetterNormalizer.EnsureCanGenerate(profile);

        CoverLetterDraft draft = await aiService.GenerateCoverLetterAsync(
            profile,
            application.Company,
            application.Role,
            application.JobDescription,
            cancellationToken);

        CoverLetter letter = CoverLetterNormalizer.Normalize(
            draft,
            profile,
            application.Company,
            application.Role,
            timeProvider.GetUtcNow());

        JobApplication? saved = await repository.SaveCoverLetterAsync(
            clientContext.ClientId,
            applicationId,
            letter,
            cancellationToken);

        return saved ?? throw new JobriqResourceNotFoundException("application", applicationId);
    }
}
