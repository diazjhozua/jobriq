using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;
using Jobriq.Infrastructure.Persistence.Postgres;
using Shouldly;

namespace Jobriq.Infrastructure.Tests.Persistence;

public sealed class PostgresJobriqRepositoryTests(PostgresFixture fixture)
    : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task GetState_ReturnsEmptyProfileAndApplicationsForNewClient()
    {
        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        JobriqState state = await repository.GetStateAsync(Guid.NewGuid(), CancellationToken.None);

        state.Profile.ShouldNotBeNull();
        state.Profile.Summary.ShouldBeEmpty();
        state.Profile.Experience.ShouldBeEmpty();
        state.Applications.ShouldBeEmpty();
    }

    [Fact]
    public async Task SaveProfile_RoundTripsNestedProfile()
    {
        Guid clientId = Guid.NewGuid();
        ResumeProfile profile = CreateProfile();

        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        await repository.SaveProfileAsync(clientId, profile, CancellationToken.None);

        JobriqState state = await repository.GetStateAsync(clientId, CancellationToken.None);
        ResumeProfile saved = state.Profile;

        saved.Personal.Name.ShouldBe("Jane Doe");
        saved.Personal.LinkedIn.ShouldBe("https://linkedin.com/in/jane");
        saved.SummaryType.ShouldBe(SummaryType.Professional);
        saved.Summary.ShouldBe("Summary.");
        saved.Experience.Single().Bullets.ShouldBe(["Built a thing"]);
        saved.Experience.Single().EnhancedBullets.ShouldNotBeNull();
        saved.Experience.Single().EnhancedBullets!.Single().Enhanced.ShouldBe("Enhanced: Built a thing");
        saved.Education.Single().School.ShouldBe("State University");
        saved.Skills.ShouldBe(["C#", "React"]);
        saved.Projects.Single().Url.ShouldBe("https://example.com/tool");
    }

    [Fact]
    public async Task SaveProfile_UpdatesExistingProfile()
    {
        Guid clientId = Guid.NewGuid();
        ResumeProfile profile = CreateProfile();
        profile.Summary = "Updated summary.";

        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        await repository.SaveProfileAsync(clientId, CreateProfile(), CancellationToken.None);
        await repository.SaveProfileAsync(clientId, profile, CancellationToken.None);

        JobriqState state = await repository.GetStateAsync(clientId, CancellationToken.None);

        state.Profile.Summary.ShouldBe("Updated summary.");
    }

    [Fact]
    public async Task ApplicationOperations_AreClientScoped()
    {
        Guid clientId = Guid.NewGuid();
        Guid otherClientId = Guid.NewGuid();
        JobApplication application = new("Acme", "Engineer", "Build things.");

        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        await repository.AddApplicationAsync(clientId, application, CancellationToken.None);

        (await repository.GetApplicationAsync(otherClientId, application.Id, CancellationToken.None))
            .ShouldBeNull();
        (await repository.UpdateStatusAsync(
            otherClientId,
            application.Id,
            ApplicationStatus.Applied,
            CancellationToken.None)).ShouldBeNull();
        (await repository.DeleteApplicationAsync(otherClientId, application.Id, CancellationToken.None))
            .ShouldBeFalse();

        JobApplication? updated = await repository.UpdateStatusAsync(
            clientId,
            application.Id,
            ApplicationStatus.Interviewing,
            CancellationToken.None);
        updated.ShouldNotBeNull();
        updated.Status.ShouldBe(ApplicationStatus.Interviewing);

        (await repository.DeleteApplicationAsync(clientId, application.Id, CancellationToken.None))
            .ShouldBeTrue();
        (await repository.GetApplicationAsync(clientId, application.Id, CancellationToken.None))
            .ShouldBeNull();
    }

    [Fact]
    public async Task GetState_OrdersApplicationsByCreatedAtDescending()
    {
        Guid clientId = Guid.NewGuid();
        JobApplication older = new("Old Co", "Engineer", "")
        {
            CreatedAt = new DateTimeOffset(2026, 1, 1, 12, 0, 0, TimeSpan.Zero)
        };
        JobApplication newer = new("New Co", "Engineer", "")
        {
            CreatedAt = new DateTimeOffset(2026, 2, 1, 12, 0, 0, TimeSpan.Zero)
        };

        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        await repository.AddApplicationAsync(clientId, older, CancellationToken.None);
        await repository.AddApplicationAsync(clientId, newer, CancellationToken.None);

        JobriqState state = await repository.GetStateAsync(clientId, CancellationToken.None);

        state.Applications.Select(application => application.Company).ShouldBe(["New Co", "Old Co"]);
    }

    [Fact]
    public async Task SaveGeneratedResume_RoundTripsDocument()
    {
        Guid clientId = Guid.NewGuid();
        JobApplication application = new("Acme", "Engineer", "Build things.");
        GeneratedResume resume = CreateGeneratedResume();

        await using (JobriqDbContext context = fixture.CreateContext())
        {
            PostgresJobriqRepository repository = new(context, TimeProvider.System);

            await repository.AddApplicationAsync(clientId, application, CancellationToken.None);
            JobApplication? updated = await repository.SaveGeneratedResumeAsync(
                clientId,
                application.Id,
                resume,
                CancellationToken.None);

            updated.ShouldNotBeNull();
            updated.GeneratedResume.ShouldNotBeNull();
        }

        await using JobriqDbContext readContext = fixture.CreateContext();
        PostgresJobriqRepository readRepository = new(readContext, TimeProvider.System);
        JobriqState state = await readRepository.GetStateAsync(clientId, CancellationToken.None);
        GeneratedResume? saved = state.Applications.Single().GeneratedResume;

        saved.ShouldNotBeNull();
        saved.Summary.ShouldBe("Tailored summary.");
        saved.Experience.Single().Bullets.Single().Enhanced.ShouldBe("Enhanced: Built a thing");
        saved.Projects.Single().Bullets.Single().NeedsQuantification.ShouldBeTrue();
        saved.Keywords.ShouldNotBeNull();
        saved.Keywords!.Matched.ShouldBe(["C#", "React"]);
        saved.Keywords.Missing.ShouldBe(["Kubernetes"]);
        saved.GeneratedAt.ShouldBe(new DateTimeOffset(2026, 10, 26, 12, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public async Task SaveStandaloneResume_RoundTripsDocument()
    {
        Guid clientId = Guid.NewGuid();
        GeneratedResume resume = CreateGeneratedResume();

        await using (JobriqDbContext context = fixture.CreateContext())
        {
            PostgresJobriqRepository repository = new(context, TimeProvider.System);

            GeneratedResume? saved = await repository.SaveStandaloneResumeAsync(
                clientId,
                resume,
                CancellationToken.None);

            saved.ShouldNotBeNull();
        }

        await using JobriqDbContext readContext = fixture.CreateContext();
        PostgresJobriqRepository readRepository = new(readContext, TimeProvider.System);
        JobriqState state = await readRepository.GetStateAsync(clientId, CancellationToken.None);
        GeneratedResume? standalone = state.StandaloneResume;

        standalone.ShouldNotBeNull();
        standalone.Summary.ShouldBe("Tailored summary.");
        standalone.Experience.Single().Bullets.Single().Enhanced.ShouldBe("Enhanced: Built a thing");
        standalone.Keywords.ShouldNotBeNull();
        standalone.Keywords!.Missing.ShouldBe(["Kubernetes"]);
        standalone.GeneratedAt.ShouldBe(new DateTimeOffset(2026, 10, 26, 12, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public async Task SaveProfile_PreservesStandaloneResume()
    {
        Guid clientId = Guid.NewGuid();

        await using (JobriqDbContext context = fixture.CreateContext())
        {
            PostgresJobriqRepository repository = new(context, TimeProvider.System);

            await repository.SaveStandaloneResumeAsync(
                clientId,
                CreateGeneratedResume(),
                CancellationToken.None);
            await repository.SaveProfileAsync(clientId, CreateProfile(), CancellationToken.None);
        }

        await using JobriqDbContext readContext = fixture.CreateContext();
        PostgresJobriqRepository readRepository = new(readContext, TimeProvider.System);
        JobriqState state = await readRepository.GetStateAsync(clientId, CancellationToken.None);

        state.Profile.Summary.ShouldBe("Summary.");
        state.StandaloneResume.ShouldNotBeNull();
        state.StandaloneResume!.Summary.ShouldBe("Tailored summary.");
    }

    [Fact]
    public async Task SaveStandaloneResume_WithoutSavedProfile_KeepsProfileEmpty()
    {
        Guid clientId = Guid.NewGuid();

        await using (JobriqDbContext context = fixture.CreateContext())
        {
            PostgresJobriqRepository repository = new(context, TimeProvider.System);

            await repository.SaveStandaloneResumeAsync(
                clientId,
                CreateGeneratedResume(),
                CancellationToken.None);
        }

        await using JobriqDbContext readContext = fixture.CreateContext();
        PostgresJobriqRepository readRepository = new(readContext, TimeProvider.System);
        JobriqState state = await readRepository.GetStateAsync(clientId, CancellationToken.None);

        state.Profile.Summary.ShouldBeEmpty();
        state.Profile.Experience.ShouldBeEmpty();
        state.StandaloneResume.ShouldNotBeNull();
    }

    private static ResumeProfile CreateProfile() => new()
    {
        Personal = new PersonalInfo
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            Phone = "555-0100",
            Location = "Remote",
            LinkedIn = "https://linkedin.com/in/jane",
            GitHub = "https://github.com/jane",
            Website = "https://jane.dev"
        },
        SummaryType = SummaryType.Professional,
        Summary = "Summary.",
        Experience =
        [
            new WorkExperience
            {
                Company = "Acme",
                Title = "Engineer",
                StartDate = "2022",
                EndDate = "Present",
                Bullets = ["Built a thing"],
                EnhancedBullets =
                [
                    new EnhancedBullet
                    {
                        Original = "Built a thing",
                        Enhanced = "Enhanced: Built a thing",
                        NeedsQuantification = true
                    }
                ]
            }
        ],
        Education =
        [
            new Education
            {
                School = "State University",
                Degree = "BSc",
                Field = "Computer Science",
                StartDate = "2018",
                EndDate = "2022",
                Gpa = "3.9"
            }
        ],
        Skills = ["C#", "React"],
        Projects =
        [
            new Project
            {
                Name = "Tool",
                Url = "https://example.com/tool",
                Bullets = ["Shipped a tool"],
                EnhancedBullets =
                [
                    new EnhancedBullet
                    {
                        Original = "Shipped a tool",
                        Enhanced = "Enhanced: Shipped a tool",
                        NeedsQuantification = false
                    }
                ]
            }
        ]
    };

    private static GeneratedResume CreateGeneratedResume() => new()
    {
        Personal = new PersonalInfo
        {
            Name = "Jane Doe",
            Email = "jane@example.com",
            LinkedIn = "https://linkedin.com/in/jane"
        },
        Summary = "Tailored summary.",
        Experience =
        [
            new GeneratedExperience
            {
                Company = "Acme",
                Title = "Engineer",
                StartDate = "2022",
                EndDate = "Present",
                Bullets =
                [
                    new EnhancedBullet
                    {
                        Original = "Built a thing",
                        Enhanced = "Enhanced: Built a thing",
                        NeedsQuantification = true
                    }
                ]
            }
        ],
        Education =
        [
            new Education
            {
                School = "State University",
                Degree = "BSc",
                Field = "Computer Science",
                StartDate = "2018",
                EndDate = "2022",
                Gpa = "3.9"
            }
        ],
        Skills = ["C#"],
        Projects =
        [
            new GeneratedProject
            {
                Name = "Tool",
                Url = "https://example.com/tool",
                Bullets =
                [
                    new EnhancedBullet
                    {
                        Original = "Shipped a tool",
                        Enhanced = "Enhanced: Shipped a tool",
                        NeedsQuantification = true
                    }
                ]
            }
        ],
        Keywords = new KeywordMatch
        {
            Matched = ["C#", "React"],
            Missing = ["Kubernetes"]
        },
        GeneratedAt = new DateTimeOffset(2026, 10, 26, 12, 0, 0, TimeSpan.Zero)
    };
}
