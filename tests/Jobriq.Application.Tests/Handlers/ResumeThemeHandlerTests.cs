using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.Common.Mapping;
using Jobriq.Application.ResumeThemes;
using Jobriq.Application.ResumeThemes.Activate;
using Jobriq.Application.ResumeThemes.Create;
using Jobriq.Application.ResumeThemes.Delete;
using Jobriq.Application.ResumeThemes.Update;
using Jobriq.Contracts;
using Jobriq.Domain.ResumeThemes;
using Jobriq.SharedKernel;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.Handlers;

public sealed class CreateResumeThemeCommandHandlerTests
{
    [Fact]
    public async Task CreatesThemeWithoutActivatingIt()
    {
        IJobriqRepository repository = Repository();
        ResumeTheme? added = null;

        repository
            .ResumeThemeNameExistsAsync(
                TestData.ClientId,
                Arg.Any<string>(),
                null,
                Arg.Any<CancellationToken>())
            .Returns(false);
        repository
            .AddResumeThemeAsync(TestData.ClientId, Arg.Any<ResumeTheme>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                added = call.Arg<ResumeTheme>();
                return added;
            });
        repository
            .GetResumeThemesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(_ => added is null
                ? ResumeThemeSettings.Empty
                : new ResumeThemeSettings([added], null));

        CreateResumeThemeCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<ResumeThemesDto> result = await handler.Handle(
            new CreateResumeThemeCommand("My theme", Styles()),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        added.ShouldNotBeNull();
        added.Name.ShouldBe("My theme");
        added.CreatedAt.ShouldBe(TestData.Now);
        result.Value.Themes.ShouldHaveSingleItem().IsActive.ShouldBeFalse();
        result.Value.ActiveThemeId.ShouldBe(ResumeThemeCatalog.ClassicId);
        result.Value.BuiltIns.Single(theme => theme.IsActive).Id
            .ShouldBe(ResumeThemeCatalog.ClassicId);
    }

    [Fact]
    public async Task ReservedNameReturnsConflict()
    {
        CreateResumeThemeCommandHandler handler = new(
            Repository(),
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<ResumeThemesDto> result = await handler.Handle(
            new CreateResumeThemeCommand("classic", Styles()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("resume_theme_name_conflict");
    }

    [Fact]
    public async Task DuplicateNameReturnsConflict()
    {
        IJobriqRepository repository = Repository();
        repository
            .ResumeThemeNameExistsAsync(
                TestData.ClientId,
                Arg.Any<string>(),
                null,
                Arg.Any<CancellationToken>())
            .Returns(true);

        CreateResumeThemeCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<ResumeThemesDto> result = await handler.Handle(
            new CreateResumeThemeCommand("My theme", Styles()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("resume_theme_name_conflict");
        await repository
            .DidNotReceive()
            .AddResumeThemeAsync(
                Arg.Any<Guid>(),
                Arg.Any<ResumeTheme>(),
                Arg.Any<CancellationToken>());
    }

    private static IJobriqRepository Repository() => Substitute.For<IJobriqRepository>();

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }

    internal static ResumeThemeStylesDto Styles() => new()
    {
        NameFont = "Georgia",
        BodyFont = "Georgia",
        TextColor = "#222222",
        MutedColor = "#666666",
        HeadingColor = "#1F3A5F",
        RuleColor = "#C9B99A",
        BodySize = 11,
        SmallSize = 10,
        HeadingSize = 13,
        NameSize = 20,
        PageMargin = 72,
        ShowRules = true
    };
}

public sealed class UpdateResumeThemeCommandHandlerTests
{
    [Fact]
    public async Task BuiltInThemeIsReadOnly()
    {
        UpdateResumeThemeCommandHandler handler = new(
            Repository(),
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<ResumeThemesDto> result = await handler.Handle(
            new UpdateResumeThemeCommand(
                ResumeThemeCatalog.ClassicId,
                "Classic",
                CreateResumeThemeCommandHandlerTests.Styles()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("resume_theme_read_only");
    }

    [Fact]
    public async Task MissingThemeReturnsNotFound()
    {
        UpdateResumeThemeCommandHandler handler = new(
            Repository(),
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<ResumeThemesDto> result = await handler.Handle(
            new UpdateResumeThemeCommand(
                Guid.NewGuid(),
                "My theme",
                CreateResumeThemeCommandHandlerTests.Styles()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("resume_theme_not_found");
    }

    [Fact]
    public async Task UpdatesDetailsAndReturnsSnapshot()
    {
        ResumeTheme theme = ResumeTheme.Create(
            "My theme",
            ResumeThemeMappings.ToDomain(CreateResumeThemeCommandHandlerTests.Styles()),
            TestData.Now);
        IJobriqRepository repository = Repository();
        repository
            .GetResumeThemeAsync(TestData.ClientId, theme.Id, Arg.Any<CancellationToken>())
            .Returns(theme);
        repository
            .ResumeThemeNameExistsAsync(
                TestData.ClientId,
                Arg.Any<string>(),
                theme.Id,
                Arg.Any<CancellationToken>())
            .Returns(false);
        repository
            .SaveResumeThemeAsync(TestData.ClientId, Arg.Any<ResumeTheme>(), Arg.Any<CancellationToken>())
            .Returns(call => call.Arg<ResumeTheme>());
        repository
            .GetResumeThemesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(new ResumeThemeSettings([theme], theme.Id));

        UpdateResumeThemeCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<ResumeThemesDto> result = await handler.Handle(
            new UpdateResumeThemeCommand(
                theme.Id,
                "Renamed",
                CreateResumeThemeCommandHandlerTests.Styles()),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Themes.ShouldHaveSingleItem().Name.ShouldBe("Renamed");
        result.Value.Themes[0].IsActive.ShouldBeTrue();
        result.Value.ActiveThemeId.ShouldBe(theme.Id);
    }

    [Fact]
    public async Task ReservedNameReturnsConflict()
    {
        ResumeTheme theme = ResumeTheme.Create(
            "My theme",
            ResumeThemeMappings.ToDomain(CreateResumeThemeCommandHandlerTests.Styles()),
            TestData.Now);
        IJobriqRepository repository = Repository();
        repository
            .GetResumeThemeAsync(TestData.ClientId, theme.Id, Arg.Any<CancellationToken>())
            .Returns(theme);

        UpdateResumeThemeCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<ResumeThemesDto> result = await handler.Handle(
            new UpdateResumeThemeCommand(
                theme.Id,
                "Modern",
                CreateResumeThemeCommandHandlerTests.Styles()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("resume_theme_name_conflict");
    }

    private static IJobriqRepository Repository() => Substitute.For<IJobriqRepository>();

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class DeleteResumeThemeCommandHandlerTests
{
    [Fact]
    public async Task BuiltInThemeIsReadOnly()
    {
        DeleteResumeThemeCommandHandler handler = new(Repository(), ClientContext());

        Result<ResumeThemesDto> result = await handler.Handle(
            new DeleteResumeThemeCommand(ResumeThemeCatalog.ModernId),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("resume_theme_read_only");
    }

    [Fact]
    public async Task MissingThemeReturnsNotFound()
    {
        IJobriqRepository repository = Repository();
        repository
            .DeleteResumeThemeAsync(TestData.ClientId, Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(false);

        DeleteResumeThemeCommandHandler handler = new(repository, ClientContext());

        Result<ResumeThemesDto> result = await handler.Handle(
            new DeleteResumeThemeCommand(Guid.NewGuid()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("resume_theme_not_found");
    }

    [Fact]
    public async Task DeletesAndReturnsSnapshot()
    {
        IJobriqRepository repository = Repository();
        repository
            .DeleteResumeThemeAsync(TestData.ClientId, Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(true);
        repository
            .GetResumeThemesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(ResumeThemeSettings.Empty);

        DeleteResumeThemeCommandHandler handler = new(repository, ClientContext());

        Result<ResumeThemesDto> result = await handler.Handle(
            new DeleteResumeThemeCommand(Guid.NewGuid()),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Themes.ShouldBeEmpty();
        result.Value.ActiveThemeId.ShouldBe(ResumeThemeCatalog.ClassicId);
    }

    private static IJobriqRepository Repository() => Substitute.For<IJobriqRepository>();

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class ActivateResumeThemeCommandHandlerTests
{
    [Fact]
    public async Task ActivatesBuiltInTheme()
    {
        IJobriqRepository repository = Repository();
        repository
            .ActivateResumeThemeAsync(
                TestData.ClientId,
                ResumeThemeCatalog.ModernId,
                Arg.Any<CancellationToken>())
            .Returns(true);
        repository
            .GetResumeThemesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(new ResumeThemeSettings([], ResumeThemeCatalog.ModernId));

        ActivateResumeThemeCommandHandler handler = new(repository, ClientContext());

        Result<ResumeThemesDto> result = await handler.Handle(
            new ActivateResumeThemeCommand(ResumeThemeCatalog.ModernId),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ActiveThemeId.ShouldBe(ResumeThemeCatalog.ModernId);
        result.Value.BuiltIns.Single(theme => theme.IsActive).Id
            .ShouldBe(ResumeThemeCatalog.ModernId);
    }

    [Fact]
    public async Task ActivatesCustomTheme()
    {
        ResumeTheme theme = ResumeTheme.Create(
            "My theme",
            ResumeThemeMappings.ToDomain(CreateResumeThemeCommandHandlerTests.Styles()),
            TestData.Now);
        IJobriqRepository repository = Repository();
        repository
            .GetResumeThemeAsync(TestData.ClientId, theme.Id, Arg.Any<CancellationToken>())
            .Returns(theme);
        repository
            .ActivateResumeThemeAsync(TestData.ClientId, theme.Id, Arg.Any<CancellationToken>())
            .Returns(true);
        repository
            .GetResumeThemesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(new ResumeThemeSettings([theme], theme.Id));

        ActivateResumeThemeCommandHandler handler = new(repository, ClientContext());

        Result<ResumeThemesDto> result = await handler.Handle(
            new ActivateResumeThemeCommand(theme.Id),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Themes.ShouldHaveSingleItem().IsActive.ShouldBeTrue();
        result.Value.ActiveThemeId.ShouldBe(theme.Id);
    }

    [Fact]
    public async Task MissingCustomThemeReturnsNotFound()
    {
        ActivateResumeThemeCommandHandler handler = new(Repository(), ClientContext());

        Result<ResumeThemesDto> result = await handler.Handle(
            new ActivateResumeThemeCommand(Guid.NewGuid()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("resume_theme_not_found");
    }

    private static IJobriqRepository Repository() => Substitute.For<IJobriqRepository>();

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class ResumeThemeResolverTests
{
    [Fact]
    public async Task ResolvesTheActiveThemeForTheClient()
    {
        ResumeTheme theme = ResumeTheme.Restore(
            Guid.Parse("99999999-9999-9999-9999-999999999999"),
            "My theme",
            ResumeThemeMappings.ToDomain(CreateResumeThemeCommandHandlerTests.Styles()),
            TestData.Now,
            TestData.Now);
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetResumeThemesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(new ResumeThemeSettings([theme], theme.Id));

        ResumeThemeDefinition resolved = await new ResumeThemeResolver(
            repository,
            ClientContext()).ResolveAsync(CancellationToken.None);

        resolved.Id.ShouldBe(theme.Id);
        resolved.Styles.NameFont.ShouldBe("Georgia");
    }

    [Fact]
    public async Task FallsBackToClassicWhenNoThemeIsActive()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetResumeThemesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(ResumeThemeSettings.Empty);

        ResumeThemeDefinition resolved = await new ResumeThemeResolver(
            repository,
            ClientContext()).ResolveAsync(CancellationToken.None);

        resolved.ShouldBe(ResumeThemeCatalog.Classic);
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}
