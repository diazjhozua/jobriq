using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Applications.Create;
using Jobriq.Application.Applications.Delete;
using Jobriq.Application.Applications.GenerateCoverLetter;
using Jobriq.Application.Applications.SaveGeneratedResume;
using Jobriq.Application.Applications.UpdateDetails;
using Jobriq.Application.Applications.UpdateStatus;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.CoverLetters.Generate;
using Jobriq.Contracts;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.Handlers;

public sealed class CreateApplicationCommandHandlerTests
{
    [Fact]
    public async Task CreatesApplicationAndReturnsDto()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .AddApplicationAsync(
                TestData.ClientId,
                Arg.Any<JobApplication>(),
                Arg.Any<CancellationToken>())
            .Returns(call => call.Arg<JobApplication>());

        CreateApplicationCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new CreateApplicationCommand(
                "Acme",
                "Engineer",
                "Build.",
                ApplicationStatusDto.Applied,
                "2022-08-01"),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Company.ShouldBe("Acme");
        result.Value.Status.ShouldBe(ApplicationStatusDto.Applied);
        result.Value.AppliedDate.ShouldBe(new DateOnly(2022, 8, 1));
    }

    [Fact]
    public async Task InvalidDate_ReturnsFailure()
    {
        CreateApplicationCommandHandler handler = new(
            Substitute.For<IJobriqRepository>(),
            ClientContext());

        var result = await handler.Handle(
            new CreateApplicationCommand("Acme", "Engineer", "", null, "August 2022"),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("invalid_request");
        result.Error.Description.ShouldBe("Date applied must be a valid date.");
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class UpdateApplicationDetailsCommandHandlerTests
{
    [Fact]
    public async Task UpdatesAndReturnsDto()
    {
        JobApplication application = Application();
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .UpdateApplicationDetailsAsync(
                TestData.ClientId,
                TestData.ApplicationId,
                "Acme Labs",
                "Senior Engineer",
                new DateOnly(2022, 9, 1),
                Arg.Any<CancellationToken>())
            .Returns(application);

        UpdateApplicationDetailsCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new UpdateApplicationDetailsCommand(
                TestData.ApplicationId,
                "Acme Labs",
                "Senior Engineer",
                "2022-09-01"),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldBe(TestData.ApplicationId);
    }

    [Fact]
    public async Task UnknownApplication_ReturnsNotFound()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .UpdateApplicationDetailsAsync(
                Arg.Any<Guid>(),
                Arg.Any<Guid>(),
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<DateOnly?>(),
                Arg.Any<CancellationToken>())
            .Returns((JobApplication?)null);

        UpdateApplicationDetailsCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new UpdateApplicationDetailsCommand(TestData.ApplicationId, "Acme", "Engineer", null),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("application_not_found");
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }

    private static JobApplication Application() => JobApplication.Restore(
        TestData.ApplicationId,
        "Acme",
        "Engineer",
        "Build.",
        ApplicationStatus.Saved,
        TestData.Now,
        null);
}

public sealed class UpdateApplicationStatusCommandHandlerTests
{
    [Fact]
    public async Task UpdatesAndReturnsDto()
    {
        JobApplication application = JobApplication.Restore(
            TestData.ApplicationId,
            "Acme",
            "Engineer",
            "Build.",
            ApplicationStatus.Interviewing,
            TestData.Now,
            null);
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .UpdateStatusAsync(
                TestData.ClientId,
                TestData.ApplicationId,
                ApplicationStatus.Interviewing,
                Arg.Any<CancellationToken>())
            .Returns(application);

        UpdateApplicationStatusCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new UpdateApplicationStatusCommand(TestData.ApplicationId, ApplicationStatusDto.Interviewing),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Status.ShouldBe(ApplicationStatusDto.Interviewing);
    }

    [Fact]
    public async Task UnknownApplication_ReturnsNotFound()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .UpdateStatusAsync(
                Arg.Any<Guid>(),
                Arg.Any<Guid>(),
                Arg.Any<ApplicationStatus>(),
                Arg.Any<CancellationToken>())
            .Returns((JobApplication?)null);

        UpdateApplicationStatusCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new UpdateApplicationStatusCommand(TestData.ApplicationId, ApplicationStatusDto.Applied),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("application_not_found");
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class DeleteApplicationCommandHandlerTests
{
    [Fact]
    public async Task DeletesApplication()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .DeleteApplicationAsync(
                TestData.ClientId,
                TestData.ApplicationId,
                Arg.Any<CancellationToken>())
            .Returns(true);

        DeleteApplicationCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new DeleteApplicationCommand(TestData.ApplicationId),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task UnknownApplication_ReturnsNotFound()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .DeleteApplicationAsync(
                Arg.Any<Guid>(),
                Arg.Any<Guid>(),
                Arg.Any<CancellationToken>())
            .Returns(false);

        DeleteApplicationCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new DeleteApplicationCommand(TestData.ApplicationId),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("application_not_found");
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class SaveGeneratedResumeCommandHandlerTests
{
    [Fact]
    public async Task SavesResumeAndReturnsApplication()
    {
        JobApplication application = JobApplication.Restore(
            TestData.ApplicationId,
            "Acme",
            "Engineer",
            "Build.",
            ApplicationStatus.Saved,
            TestData.Now,
            ResumeMappings.ToDomain(TestData.GeneratedResume()));
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .SaveGeneratedResumeAsync(
                TestData.ClientId,
                TestData.ApplicationId,
                Arg.Any<GeneratedResume>(),
                Arg.Any<CancellationToken>())
            .Returns(application);

        SaveGeneratedResumeCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new SaveGeneratedResumeCommand(TestData.ApplicationId, TestData.GeneratedResume()),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.GeneratedResume!.Summary.ShouldBe("Deterministic professional summary.");
    }

    [Fact]
    public async Task UnknownApplication_ReturnsNotFound()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .SaveGeneratedResumeAsync(
                Arg.Any<Guid>(),
                Arg.Any<Guid>(),
                Arg.Any<GeneratedResume>(),
                Arg.Any<CancellationToken>())
            .Returns((JobApplication?)null);

        SaveGeneratedResumeCommandHandler handler = new(repository, ClientContext());

        var result = await handler.Handle(
            new SaveGeneratedResumeCommand(TestData.ApplicationId, TestData.GeneratedResume()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("application_not_found");
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class GenerateCoverLetterCommandHandlerTests
{
    [Fact]
    public async Task GeneratesAndSavesLetter()
    {
        JobApplication application = JobApplication.Restore(
            TestData.ApplicationId,
            "Acme",
            "Engineer",
            "Build.",
            ApplicationStatus.Saved,
            TestData.Now,
            null);

        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        aiService
            .GenerateCoverLetterAsync(
                Arg.Any<ResumeProfile>(),
                "Acme",
                "Engineer",
                "Build.",
                Arg.Any<CancellationToken>())
            .Returns(new CoverLetterDraft
            {
                Closing = "Sincerely,",
                Paragraphs =
                [
                    Paragraph("dependable delivery"),
                    Paragraph("clear communication"),
                    Paragraph("measurable outcomes"),
                    Paragraph("reliable systems"),
                    Paragraph("steady collaboration")
                ]
            });

        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetApplicationAsync(TestData.ClientId, TestData.ApplicationId, Arg.Any<CancellationToken>())
            .Returns(application);
        repository
            .GetProfileAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(ProfileMappings.ToDomain(TestData.Profile()));
        repository
            .SaveCoverLetterAsync(
                TestData.ClientId,
                TestData.ApplicationId,
                Arg.Any<CoverLetter>(),
                Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                application.AttachCoverLetter(call.Arg<CoverLetter>());
                return application;
            });

        GenerateCoverLetterCommandHandler handler = new(
            aiService,
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        var result = await handler.Handle(
            new GenerateCoverLetterCommand(TestData.ApplicationId),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.CoverLetter!.Signature.ShouldBe("Jane Doe");
        result.Value.CoverLetter!.Paragraphs!.Count.ShouldBe(5);
    }

    [Fact]
    public async Task UnknownApplication_ThrowsNotFound()
    {
        IResumeAiService aiService = Substitute.For<IResumeAiService>();
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetApplicationAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((JobApplication?)null);

        GenerateCoverLetterCommandHandler handler = new(
            aiService,
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        await Should.ThrowAsync<JobriqResourceNotFoundException>(async () =>
            await handler.Handle(
                new GenerateCoverLetterCommand(TestData.ApplicationId),
                CancellationToken.None));
    }

    [Fact]
    public async Task ProfileWithoutName_ThrowsValidation()
    {
        JobApplication application = JobApplication.Restore(
            TestData.ApplicationId,
            "Acme",
            "Engineer",
            "Build.",
            ApplicationStatus.Saved,
            TestData.Now,
            null);
        ProfileDto profile = TestData.Profile();
        profile.Personal!.Name = string.Empty;

        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetApplicationAsync(TestData.ClientId, TestData.ApplicationId, Arg.Any<CancellationToken>())
            .Returns(application);
        repository
            .GetProfileAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(ProfileMappings.ToDomain(profile));

        GenerateCoverLetterCommandHandler handler = new(
            Substitute.For<IResumeAiService>(),
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        await Should.ThrowAsync<JobriqValidationException>(async () =>
            await handler.Handle(
                new GenerateCoverLetterCommand(TestData.ApplicationId),
                CancellationToken.None));
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }

    private static string Paragraph(string topic) =>
        $"In my recent work I focused on {topic} and made sure the results were measurable and easy for the team to understand. " +
        "I documented the decisions, kept the handoffs small, and followed through until the changes held up under real use. " +
        "The outcome was calmer delivery and more confidence across the group.";
}
