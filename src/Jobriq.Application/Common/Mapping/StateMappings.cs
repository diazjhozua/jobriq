using Jobriq.Contracts;
using Jobriq.Domain.State;

namespace Jobriq.Application.Common.Mapping;

public static class StateMappings
{
    public static StateDto ToDto(JobriqState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        return new StateDto
        {
            Profile = ProfileMappings.ToDto(state.Profile),
            Applications = state.Applications is null
                ? []
                : state.Applications.Select(ApplicationMappings.ToDto).ToList(),
            StandaloneResume = state.StandaloneResume is null
                ? null
                : ResumeMappings.ToDto(state.StandaloneResume)
        };
    }
}
