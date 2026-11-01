using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Application.PromptStyles;
using Jobriq.Application.PromptStyles.Activate;
using Jobriq.Application.PromptStyles.Create;
using Jobriq.Application.PromptStyles.Delete;
using Jobriq.Application.PromptStyles.Update;
using Jobriq.Contracts;
using Jobriq.Domain.PromptStyles;
using Jobriq.SharedKernel;
using NSubstitute;
using Shouldly;

namespace Jobriq.Application.Tests.Handlers;

public sealed class CreatePromptStyleCommandHandlerTests
{
    [Fact]
    public async Task FirstStyleIsActivated()
    {
        IJobriqRepository repository = Repository();
        PromptStyle? added = null;

        repository
            .PromptStyleNameExistsAsync(
                TestData.ClientId,
                Arg.Any<string>(),
                null,
                Arg.Any<CancellationToken>())
            .Returns(false);
        repository
            .GetPromptStylesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(_ => added is null
                ? PromptStyleSettings.Empty
                : new PromptStyleSettings([added], added.IsActive ? added.Id : null));
        repository
            .AddPromptStyleAsync(TestData.ClientId, Arg.Any<PromptStyle>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                added = call.Arg<PromptStyle>();
                return added;
            });

        CreatePromptStyleCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<PromptStylesDto> result = await handler.Handle(
            new CreatePromptStyleCommand("Warm voice", "Be warm."),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        added.ShouldNotBeNull();
        added.IsActive.ShouldBeTrue();
        added.CreatedAt.ShouldBe(TestData.Now);
        result.Value.Styles.ShouldHaveSingleItem().IsActive.ShouldBeTrue();
        result.Value.ActiveStyleId.ShouldBe(added.Id);
        result.Value.Baseline.IsActive.ShouldBeFalse();
    }

    [Fact]
    public async Task LaterStyleStaysInactive()
    {
        PromptStyle existing = PromptStyle.Create("Existing", "Be plain.", TestData.Now);
        existing.Activate();
        IJobriqRepository repository = Repository();
        PromptStyle? added = null;

        repository
            .PromptStyleNameExistsAsync(
                TestData.ClientId,
                Arg.Any<string>(),
                null,
                Arg.Any<CancellationToken>())
            .Returns(false);
        repository
            .GetPromptStylesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(_ => added is null
                ? new PromptStyleSettings([existing], existing.Id)
                : new PromptStyleSettings([existing, added], existing.Id));
        repository
            .AddPromptStyleAsync(TestData.ClientId, Arg.Any<PromptStyle>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                added = call.Arg<PromptStyle>();
                return added;
            });

        CreatePromptStyleCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<PromptStylesDto> result = await handler.Handle(
            new CreatePromptStyleCommand("Warm voice", "Be warm."),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        added.ShouldNotBeNull();
        added.IsActive.ShouldBeFalse();
        result.Value.ActiveStyleId.ShouldBe(existing.Id);
        result.Value.Styles.Count.ShouldBe(2);
    }

    [Fact]
    public async Task DuplicateNameReturnsConflict()
    {
        IJobriqRepository repository = Repository();
        repository
            .PromptStyleNameExistsAsync(
                TestData.ClientId,
                Arg.Any<string>(),
                null,
                Arg.Any<CancellationToken>())
            .Returns(true);

        CreatePromptStyleCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<PromptStylesDto> result = await handler.Handle(
            new CreatePromptStyleCommand("Warm voice", "Be warm."),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("prompt_style_name_conflict");
        await repository
            .DidNotReceive()
            .AddPromptStyleAsync(
                Arg.Any<Guid>(),
                Arg.Any<PromptStyle>(),
                Arg.Any<CancellationToken>());
    }

    private static IJobriqRepository Repository() => Substitute.For<IJobriqRepository>();

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class UpdatePromptStyleCommandHandlerTests
{
    [Fact]
    public async Task MissingStyleReturnsNotFound()
    {
        IJobriqRepository repository = Repository();

        UpdatePromptStyleCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<PromptStylesDto> result = await handler.Handle(
            new UpdatePromptStyleCommand(Guid.NewGuid(), "Warm voice", "Be warm."),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("prompt_style_not_found");
    }

    [Fact]
    public async Task DuplicateNameReturnsConflict()
    {
        PromptStyle style = PromptStyle.Create("Warm voice", "Be warm.", TestData.Now);
        IJobriqRepository repository = Repository();
        repository
            .GetPromptStyleAsync(TestData.ClientId, style.Id, Arg.Any<CancellationToken>())
            .Returns(style);
        repository
            .PromptStyleNameExistsAsync(
                TestData.ClientId,
                Arg.Any<string>(),
                style.Id,
                Arg.Any<CancellationToken>())
            .Returns(true);

        UpdatePromptStyleCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<PromptStylesDto> result = await handler.Handle(
            new UpdatePromptStyleCommand(style.Id, "Other", "Be warm."),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("prompt_style_name_conflict");
    }

    [Fact]
    public async Task UpdatesDetailsAndReturnsSnapshot()
    {
        PromptStyle style = PromptStyle.Create("Warm voice", "Be warm.", TestData.Now);
        IJobriqRepository repository = Repository();
        repository
            .GetPromptStyleAsync(TestData.ClientId, style.Id, Arg.Any<CancellationToken>())
            .Returns(style);
        repository
            .PromptStyleNameExistsAsync(
                TestData.ClientId,
                Arg.Any<string>(),
                style.Id,
                Arg.Any<CancellationToken>())
            .Returns(false);
        repository
            .SavePromptStyleAsync(TestData.ClientId, Arg.Any<PromptStyle>(), Arg.Any<CancellationToken>())
            .Returns(call => call.Arg<PromptStyle>());
        repository
            .GetPromptStylesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(new PromptStyleSettings([style], null));

        UpdatePromptStyleCommandHandler handler = new(
            repository,
            ClientContext(),
            new TestTimeProvider(TestData.Now));

        Result<PromptStylesDto> result = await handler.Handle(
            new UpdatePromptStyleCommand(style.Id, "Warmer voice", "Be warmer."),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Styles.ShouldHaveSingleItem().Name.ShouldBe("Warmer voice");
        result.Value.Styles[0].Instructions.ShouldBe("Be warmer.");
        result.Value.Styles[0].UpdatedAt.ShouldBe(TestData.Now);
    }

    private static IJobriqRepository Repository() => Substitute.For<IJobriqRepository>();

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class DeletePromptStyleCommandHandlerTests
{
    [Fact]
    public async Task MissingStyleReturnsNotFound()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .DeletePromptStyleAsync(TestData.ClientId, Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(false);

        DeletePromptStyleCommandHandler handler = new(repository, ClientContext());

        Result<PromptStylesDto> result = await handler.Handle(
            new DeletePromptStyleCommand(Guid.NewGuid()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("prompt_style_not_found");
    }

    [Fact]
    public async Task DeletesAndReturnsRemainingStyles()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .DeletePromptStyleAsync(TestData.ClientId, Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(true);
        repository
            .GetPromptStylesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(PromptStyleSettings.Empty);

        DeletePromptStyleCommandHandler handler = new(repository, ClientContext());

        Result<PromptStylesDto> result = await handler.Handle(
            new DeletePromptStyleCommand(Guid.NewGuid()),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Styles.ShouldBeEmpty();
        result.Value.ActiveStyleId.ShouldBeNull();
        result.Value.Baseline.IsActive.ShouldBeTrue();
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class ActivatePromptStyleCommandHandlerTests
{
    [Fact]
    public async Task MissingStyleReturnsNotFound()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();

        ActivatePromptStyleCommandHandler handler = new(repository, ClientContext());

        Result<PromptStylesDto> result = await handler.Handle(
            new ActivatePromptStyleCommand(Guid.NewGuid()),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("prompt_style_not_found");
    }

    [Fact]
    public async Task ActivatesAndReturnsSnapshot()
    {
        PromptStyle style = PromptStyle.Create("Warm voice", "Be warm.", TestData.Now);
        style.Activate();
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .ActivatePromptStyleAsync(TestData.ClientId, style.Id, Arg.Any<CancellationToken>())
            .Returns(style);
        repository
            .GetPromptStylesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(new PromptStyleSettings([style], style.Id));

        ActivatePromptStyleCommandHandler handler = new(repository, ClientContext());

        Result<PromptStylesDto> result = await handler.Handle(
            new ActivatePromptStyleCommand(style.Id),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ActiveStyleId.ShouldBe(style.Id);
        result.Value.Styles.ShouldHaveSingleItem().IsActive.ShouldBeTrue();
        result.Value.Baseline.IsActive.ShouldBeFalse();
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}

public sealed class PromptStyleResolverTests
{
    [Fact]
    public async Task ResolvesTheActiveStyleForTheClient()
    {
        PromptStyle style = PromptStyle.Restore(
            Guid.Parse("99999999-9999-9999-9999-999999999999"),
            "Warm voice",
            "Be warm.",
            isActive: true,
            TestData.Now,
            TestData.Now);
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetPromptStylesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(new PromptStyleSettings([style], style.Id));

        PromptStyleDefinition resolved = await new PromptStyleResolver(
            repository,
            ClientContext()).ResolveAsync(CancellationToken.None);

        resolved.Id.ShouldBe(style.Id);
        resolved.Instructions.ShouldBe("Be warm.");
    }

    [Fact]
    public async Task FallsBackToTheBuiltInBaselineWhenNoStyleIsActive()
    {
        IJobriqRepository repository = Substitute.For<IJobriqRepository>();
        repository
            .GetPromptStylesAsync(TestData.ClientId, Arg.Any<CancellationToken>())
            .Returns(PromptStyleSettings.Empty);

        PromptStyleDefinition resolved = await new PromptStyleResolver(
            repository,
            ClientContext()).ResolveAsync(CancellationToken.None);

        resolved.ShouldBe(PromptStyleDefinition.BuiltIn);
    }

    private static IClientContext ClientContext()
    {
        IClientContext context = Substitute.For<IClientContext>();
        context.ClientId.Returns(TestData.ClientId);
        return context;
    }
}
