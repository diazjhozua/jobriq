namespace Jobriq.Contracts;

public sealed class CreateResumeThemeRequest
{
    public string? Name { get; set; }

    public ResumeThemeStylesDto? Styles { get; set; }
}

public sealed class UpdateResumeThemeRequest
{
    public string? Name { get; set; }

    public ResumeThemeStylesDto? Styles { get; set; }
}
