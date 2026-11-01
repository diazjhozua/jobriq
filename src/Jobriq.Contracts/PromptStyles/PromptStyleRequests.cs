namespace Jobriq.Contracts;

public sealed class CreatePromptStyleRequest
{
    public string? Name { get; set; }

    public string? Instructions { get; set; }
}

public sealed class UpdatePromptStyleRequest
{
    public string? Name { get; set; }

    public string? Instructions { get; set; }
}
