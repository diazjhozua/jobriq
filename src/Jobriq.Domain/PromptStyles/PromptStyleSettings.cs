namespace Jobriq.Domain.PromptStyles;

public sealed record PromptStyleSettings(IReadOnlyList<PromptStyle> Styles, Guid? ActiveStyleId)
{
    public static PromptStyleSettings Empty { get; } = new([], null);

    public PromptStyleDefinition ResolveActiveDefinition() =>
        Styles.FirstOrDefault(style => style.Id == ActiveStyleId)?.ToDefinition()
        ?? PromptStyleDefinition.BuiltIn;
}
