using Jobriq.Domain.Applications;
using Jobriq.Domain.PromptStyles;
using Jobriq.Domain.Resumes;

namespace Jobriq.Domain.State;

public sealed record JobriqState
{
    public JobriqState(
        ResumeProfile profile,
        IReadOnlyList<JobApplication> applications,
        GeneratedResume? standaloneResume = null,
        PromptStyleSettings? promptStyles = null)
    {
        Profile = profile;
        Applications = applications;
        StandaloneResume = standaloneResume;
        PromptStyles = promptStyles ?? PromptStyleSettings.Empty;
    }

    public ResumeProfile Profile { get; init; }

    public IReadOnlyList<JobApplication> Applications { get; init; }

    public GeneratedResume? StandaloneResume { get; init; }

    public PromptStyleSettings PromptStyles { get; init; }
}
