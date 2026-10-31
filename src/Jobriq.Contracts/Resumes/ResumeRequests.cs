namespace Jobriq.Contracts;

public sealed class GenerateResumeRequest
{
    public ProfileDto? Profile { get; set; }

    public string? JobDescription { get; set; }
}

public sealed class ExportResumeRequest
{
    public GeneratedResumeDto? Resume { get; set; }

    public ExportFormatDto Format { get; set; }
}
