using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Resumes.GenerateResume;
using Jobriq.Domain.Resumes;

namespace Jobriq.Application.Profiles.GenerateStandaloneResume;

public sealed class GenerateStandaloneResumeUseCase(
    GenerateResumeUseCase generateResume,
    IJobriqRepository repository,
    IClientContext clientContext)
{
    public async Task<GeneratedResume> ExecuteAsync(
        ResumeProfile profile,
        string? jobDescription,
        CancellationToken cancellationToken)
    {
        GeneratedResume resume = await generateResume.ExecuteAsync(
            profile,
            jobDescription,
            cancellationToken);

        await repository.SaveStandaloneResumeAsync(
            clientContext.ClientId,
            resume,
            cancellationToken);

        return resume;
    }
}
