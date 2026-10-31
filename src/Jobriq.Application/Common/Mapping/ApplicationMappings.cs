using Jobriq.Contracts;
using Jobriq.Domain.Applications;

namespace Jobriq.Application.Common.Mapping;

public static class ApplicationMappings
{
    public static ApplicationDto ToDto(JobApplication application)
    {
        ArgumentNullException.ThrowIfNull(application);

        return new ApplicationDto
        {
            Id = application.Id,
            Company = application.Company,
            Role = application.Role,
            JobDescription = application.JobDescription,
            Status = EnumMappings.Map<ApplicationStatus, ApplicationStatusDto>(application.Status),
            CreatedAt = application.CreatedAt,
            AppliedDate = application.AppliedDate,
            GeneratedResume = application.GeneratedResume is null
                ? null
                : ResumeMappings.ToDto(application.GeneratedResume),
            CoverLetter = application.CoverLetter is null
                ? null
                : CoverLetterMappings.ToDto(application.CoverLetter)
        };
    }
}
