namespace Jobriq.Contracts;

public sealed class PromptStylesDto
{
    public List<PromptStyleDto> Styles { get; set; } = [];

    public Guid? ActiveStyleId { get; set; }

    public PromptStyleDto Baseline { get; set; } = new();
}
