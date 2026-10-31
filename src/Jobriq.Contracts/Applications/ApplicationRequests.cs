namespace Jobriq.Contracts;

public sealed class CreateApplicationRequest
{
    public string? Company { get; set; }

    public string? Role { get; set; }

    public string? JobDescription { get; set; }

    public ApplicationStatusDto? Status { get; set; }

    public string? AppliedDate { get; set; }
}

public sealed class UpdateApplicationDetailsRequest
{
    public string? Company { get; set; }

    public string? Role { get; set; }

    public string? AppliedDate { get; set; }
}

public sealed class UpdateApplicationStatusRequest
{
    public ApplicationStatusDto? Status { get; set; }
}

public sealed class SaveGeneratedResumeRequest
{
    public GeneratedResumeDto? Resume { get; set; }
}

public sealed class ApplicationResponse
{
    public ApplicationDto Application { get; set; } = new();
}

public sealed class ExportCoverLetterRequest
{
    public CoverLetterDto? Letter { get; set; }
}
