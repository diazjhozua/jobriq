using FluentValidation;
using Jobriq.Application.Abstractions.Behaviors;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.SharedKernel;
using Shouldly;

namespace Jobriq.Application.Tests.Behaviors;

public sealed class ValidationDecoratorTests
{
    [Fact]
    public async Task InvalidCommand_ShortCircuitsHandler()
    {
        CountingHandler innerHandler = new();
        ValidationDecorator.CommandHandler<TestCommand, int> decorator = new(
            innerHandler,
            [new PositiveValidator()]);

        Result<int> result = await decorator.Handle(
            new TestCommand(0),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("invalid_request");
        result.Error.Description.ShouldBe("Value must be positive.");
        innerHandler.Calls.ShouldBe(0);
    }

    [Fact]
    public async Task ValidCommand_DelegatesToHandler()
    {
        CountingHandler innerHandler = new();
        ValidationDecorator.CommandHandler<TestCommand, int> decorator = new(
            innerHandler,
            [new PositiveValidator()]);

        Result<int> result = await decorator.Handle(
            new TestCommand(7),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(7);
        innerHandler.Calls.ShouldBe(1);
    }

    [Fact]
    public async Task NoValidators_DelegatesToHandler()
    {
        CountingHandler innerHandler = new();
        ValidationDecorator.CommandHandler<TestCommand, int> decorator = new(
            innerHandler,
            []);

        Result<int> result = await decorator.Handle(
            new TestCommand(-1),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        innerHandler.Calls.ShouldBe(1);
    }

    private sealed record TestCommand(int Value) : ICommand<int>;

    private sealed class CountingHandler : ICommandHandler<TestCommand, int>
    {
        public int Calls { get; private set; }

        public Task<Result<int>> Handle(TestCommand command, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(Result.Success(command.Value));
        }
    }

    private sealed class PositiveValidator : AbstractValidator<TestCommand>
    {
        public PositiveValidator()
        {
            RuleFor(command => command.Value)
                .GreaterThan(0)
                .WithMessage("Value must be positive.");
        }
    }
}
