using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.Resumes.Generate;
using Jobriq.Contracts;
using Jobriq.Domain.Resumes;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Profiles.GenerateStandaloneResume;

internal sealed class GenerateStandaloneResumeCommandHandler(
    ICommandHandler<GenerateResumeCommand, GeneratedResumeDto> generateResume,
    IJobriqRepository repository,
    IClientContext clientContext)
    : ICommandHandler<GenerateStandaloneResumeCommand, GeneratedResumeDto>
{
    public async Task<Result<GeneratedResumeDto>> Handle(
        GenerateStandaloneResumeCommand command,
        CancellationToken cancellationToken)
    {
        Result<GeneratedResumeDto> generated = await generateResume.Handle(
            new GenerateResumeCommand(command.Profile, command.JobDescription),
            cancellationToken);

        if (generated.IsFailure)
        {
            return generated;
        }

        GeneratedResume resume = ResumeMappings.ToDomain(generated.Value);

        await repository.SaveStandaloneResumeAsync(
            clientContext.ClientId,
            resume,
            cancellationToken);

        return generated.Value;
    }
}
