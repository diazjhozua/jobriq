namespace Jobriq.Contracts;

public sealed class StateDto
{
    public ProfileDto Profile { get; set; } = new();

    public List<ApplicationDto> Applications { get; set; } = [];

    public GeneratedResumeDto? StandaloneResume { get; set; }

    public PromptStylesDto PromptStyles { get; set; } = new();

    public ResumeThemesDto ResumeThemes { get; set; } = new();
}
