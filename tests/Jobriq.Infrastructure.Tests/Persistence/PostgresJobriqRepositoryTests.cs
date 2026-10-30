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
        saved.Projects.Single().StartDate.ShouldBe("Aug 2022");
        saved.Projects.Single().EndDate.ShouldBe("Present");
        saved.Projects.Single().AssociatedWith.ShouldBe("Acme");
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
    public async Task ApplicationAppliedDate_RoundTrips()
    {
        Guid clientId = Guid.NewGuid();
        DateOnly appliedDate = new(2022, 8, 1);
        JobApplication application = new("Acme", "Engineer", "", appliedDate);

        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        await repository.AddApplicationAsync(clientId, application, CancellationToken.None);

        JobApplication? saved = await repository.GetApplicationAsync(
            clientId,
            application.Id,
            CancellationToken.None);

        saved.ShouldNotBeNull();
        saved.AppliedDate.ShouldBe(appliedDate);
    }

    [Fact]
    public async Task UpdateApplicationDetails_RoundTrips()
    {
        Guid clientId = Guid.NewGuid();
        JobApplication application = new("Acme", "Engineer", "");
        DateOnly appliedDate = new(2022, 8, 1);

        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        await repository.AddApplicationAsync(clientId, application, CancellationToken.None);
        JobApplication? updated = await repository.UpdateApplicationDetailsAsync(
            clientId,
            application.Id,
            "Globex",
            "Developer",
            appliedDate,
            CancellationToken.None);

        updated.ShouldNotBeNull();
        updated.Company.ShouldBe("Globex");
        updated.Role.ShouldBe("Developer");
        updated.AppliedDate.ShouldBe(appliedDate);

        JobApplication? saved = await repository.GetApplicationAsync(
            clientId,
            application.Id,
            CancellationToken.None);
        saved.ShouldNotBeNull();
        saved.Company.ShouldBe("Globex");
        saved.AppliedDate.ShouldBe(appliedDate);
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
        saved.Projects.Single().Bullets.Single().Enhanced.ShouldBe("Enhanced: Shipped a tool");
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

    [Fact]
    public async Task GetProfileAsync_ReturnsSavedProfileOrEmptyProfile()
    {
        Guid clientId = Guid.NewGuid();

        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        ResumeProfile missing = await repository.GetProfileAsync(clientId, CancellationToken.None);
        missing.Personal.Name.ShouldBeEmpty();

        await repository.SaveProfileAsync(clientId, CreateProfile(), CancellationToken.None);

        ResumeProfile saved = await repository.GetProfileAsync(clientId, CancellationToken.None);
        saved.Personal.Name.ShouldBe("Jane Doe");
        saved.Summary.ShouldBe("Summary.");
    }

    [Fact]
    public async Task SaveCoverLetter_RoundTripsDocument()
    {
        Guid clientId = Guid.NewGuid();
        JobApplication application = new("Acme", "Engineer", "Build things.");

        await using (JobriqDbContext context = fixture.CreateContext())
        {
            PostgresJobriqRepository repository = new(context, TimeProvider.System);

            await repository.AddApplicationAsync(clientId, application, CancellationToken.None);
            JobApplication? updated = await repository.SaveCoverLetterAsync(
                clientId,
                application.Id,
                CreateCoverLetter(),
                CancellationToken.None);

            updated.ShouldNotBeNull();
            updated.CoverLetter.ShouldNotBeNull();
        }

        await using JobriqDbContext readContext = fixture.CreateContext();
        PostgresJobriqRepository readRepository = new(readContext, TimeProvider.System);
        JobriqState state = await readRepository.GetStateAsync(clientId, CancellationToken.None);
        CoverLetter? saved = state.Applications.Single().CoverLetter;

        saved.ShouldNotBeNull();
        saved.Salutation.ShouldBe("Dear Acme Hiring Team,");
        saved.Paragraphs.ShouldBe(["First paragraph.", "Second paragraph.", "Third paragraph."]);
        saved.Closing.ShouldBe("Sincerely,");
        saved.Signature.ShouldBe("Jane Doe");
        saved.Personal.Email.ShouldBe("jane@example.com");
        saved.GeneratedAt.ShouldBe(new DateTimeOffset(2026, 10, 26, 12, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public async Task SaveCoverLetter_ReturnsNullForUnknownApplication()
    {
        await using JobriqDbContext context = fixture.CreateContext();
        PostgresJobriqRepository repository = new(context, TimeProvider.System);

        JobApplication? saved = await repository.SaveCoverLetterAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            CreateCoverLetter(),
            CancellationToken.None);

        saved.ShouldBeNull();
    }

    private static CoverLetter CreateCoverLetter() => new()
    {
        Personal = new PersonalInfo { Name = "Jane Doe", Email = "jane@example.com" },
        Company = "Acme",
        Role = "Engineer",
        Salutation = "Dear Acme Hiring Team,",
        Paragraphs = ["First paragraph.", "Second paragraph.", "Third paragraph."],
        Closing = "Sincerely,",
        Signature = "Jane Doe",
        GeneratedAt = new DateTimeOffset(2026, 10, 26, 12, 0, 0, TimeSpan.Zero)
    };

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
                        Enhanced = "Enhanced: Built a thing"
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
                StartDate = "Aug 2022",
                EndDate = "Present",
                AssociatedWith = "Acme",
                Bullets = ["Shipped a tool"],
                EnhancedBullets =
                [
                    new EnhancedBullet
                    {
                        Original = "Shipped a tool",
                        Enhanced = "Enhanced: Shipped a tool"
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
                        Enhanced = "Enhanced: Built a thing"
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
                StartDate = "Aug 2022",
                EndDate = "Present",
                AssociatedWith = "Acme",
                Bullets =
                [
                    new EnhancedBullet
                    {
                        Original = "Shipped a tool",
                        Enhanced = "Enhanced: Shipped a tool"
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
