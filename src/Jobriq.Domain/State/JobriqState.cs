using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;

namespace Jobriq.Domain.State;

public sealed record JobriqState(
    ResumeProfile Profile,
    IReadOnlyList<JobApplication> Applications);
