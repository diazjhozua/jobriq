using Jobriq.Application.Abstractions;
using Jobriq.Application.Abstractions.Behaviors;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.SharedKernel;
using Microsoft.Extensions.Logging.Abstractions;
using Shouldly;

namespace Jobriq.Application.Tests.Behaviors;

public sealed class ErrorHandlingDecoratorTests
{
    [Fact]
    public async Task NotFoundException_BecomesResultFailure()
    {
        Guid id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ErrorHandlingDecorator.CommandHandler<TestCommand, int> decorator = new(
            new ThrowingHandler(new JobriqResourceNotFoundException("application", id)),
            NullLogger<ErrorHandlingDecorator.CommandHandler<TestCommand, int>>.Instance);

        Result<int> result = await decorator.Handle(
            new TestCommand(),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("application_not_found");
        result.Error.Type.ShouldBe(ErrorType.NotFound);
        result.Error.Description.ShouldBe("The application was not found.");
    }

    [Fact]
    public async Task MissingApiKeyException_BecomesUnavailableFailure()
    {
        ErrorHandlingDecorator.CommandHandler<TestCommand, int> decorator = new(
            new ThrowingHandler(new MissingApiKeyException()),
            NullLogger<ErrorHandlingDecorator.CommandHandler<TestCommand, int>>.Instance);

        Result<int> result = await decorator.Handle(
            new TestCommand(),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("missing_api_key");
        result.Error.Type.ShouldBe(ErrorType.Unavailable);
        result.Error.StatusCode.ShouldBe(503);
    }

    [Fact]
    public async Task AiServiceException_KeepsStatusAndCode()
    {
        ErrorHandlingDecorator.CommandHandler<TestCommand, int> decorator = new(
            new ThrowingHandler(new AiServiceException("openai_rate_limited", "Slow down.", 429)),
            NullLogger<ErrorHandlingDecorator.CommandHandler<TestCommand, int>>.Instance);

        Result<int> result = await decorator.Handle(
            new TestCommand(),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("openai_rate_limited");
        result.Error.Type.ShouldBe(ErrorType.TooManyRequests);
        result.Error.StatusCode.ShouldBe(429);
    }

    [Fact]
    public async Task UnknownException_Rethrows()
    {
        ErrorHandlingDecorator.CommandHandler<TestCommand, int> decorator = new(
            new ThrowingHandler(new InvalidOperationException("Boom.")),
            NullLogger<ErrorHandlingDecorator.CommandHandler<TestCommand, int>>.Instance);

        await Should.ThrowAsync<InvalidOperationException>(async () =>
            await decorator.Handle(new TestCommand(), CancellationToken.None));
    }

    private sealed record TestCommand : ICommand<int>;

    private sealed class ThrowingHandler(Exception exception) : ICommandHandler<TestCommand, int>
    {
        public Task<Result<int>> Handle(TestCommand command, CancellationToken cancellationToken) =>
            Task.FromException<Result<int>>(exception);
    }
}
