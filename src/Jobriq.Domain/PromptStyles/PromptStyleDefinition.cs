namespace Jobriq.Domain.PromptStyles;

public sealed record PromptStyleDefinition(Guid Id, string Name, string Instructions)
{
    public static PromptStyleDefinition BuiltIn { get; } = new(
        PromptStyleCatalog.BuiltInId,
        PromptStyleCatalog.BuiltInName,
        PromptStyleCatalog.BuiltInInstructions);

    public bool IsBuiltIn => Id == PromptStyleCatalog.BuiltInId;
}
