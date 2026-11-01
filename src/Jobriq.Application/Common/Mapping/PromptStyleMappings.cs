using Jobriq.Contracts;
using Jobriq.Domain.PromptStyles;

namespace Jobriq.Application.Common.Mapping;

public static class PromptStyleMappings
{
    public static PromptStylesDto ToDto(PromptStyleSettings settings)
    {
        ArgumentNullException.ThrowIfNull(settings);

        return new PromptStylesDto
        {
            Styles = [.. settings.Styles.Select(ToDto)],
            ActiveStyleId = settings.ActiveStyleId,
            Baseline = ToDto(PromptStyleDefinition.BuiltIn, settings.ActiveStyleId is null)
        };
    }

    public static PromptStyleDto ToDto(PromptStyle style)
    {
        ArgumentNullException.ThrowIfNull(style);

        return new PromptStyleDto
        {
            Id = style.Id,
            Name = style.Name,
            Instructions = style.Instructions,
            IsActive = style.IsActive,
            CreatedAt = style.CreatedAt,
            UpdatedAt = style.UpdatedAt
        };
    }

    private static PromptStyleDto ToDto(PromptStyleDefinition definition, bool isActive) =>
        new()
        {
            Id = definition.Id,
            Name = definition.Name,
            Instructions = definition.Instructions,
            IsActive = isActive
        };
}
