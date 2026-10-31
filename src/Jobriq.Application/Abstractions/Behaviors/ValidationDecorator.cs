using FluentValidation;
using FluentValidation.Results;
using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Common.Errors;
using Jobriq.SharedKernel;

namespace Jobriq.Application.Abstractions.Behaviors;

internal static class ValidationDecorator
{
    internal sealed class CommandHandler<TCommand, TResponse>(
        ICommandHandler<TCommand, TResponse> innerHandler,
        IEnumerable<IValidator<TCommand>> validators)
        : ICommandHandler<TCommand, TResponse>
        where TCommand : ICommand<TResponse>
    {
        public async Task<Result<TResponse>> Handle(
            TCommand command,
            CancellationToken cancellationToken)
        {
            Error? error = await ValidateAsync(command, validators, cancellationToken);
            if (error is not null)
            {
                return Result.Failure<TResponse>(error);
            }

            return await innerHandler.Handle(command, cancellationToken);
        }
    }

    internal sealed class CommandBaseHandler<TCommand>(
        ICommandHandler<TCommand> innerHandler,
        IEnumerable<IValidator<TCommand>> validators)
        : ICommandHandler<TCommand>
        where TCommand : ICommand
    {
        public async Task<Result> Handle(TCommand command, CancellationToken cancellationToken)
        {
            Error? error = await ValidateAsync(command, validators, cancellationToken);
            if (error is not null)
            {
                return Result.Failure(error);
            }

            return await innerHandler.Handle(command, cancellationToken);
        }
    }

    internal sealed class QueryHandler<TQuery, TResponse>(
        IQueryHandler<TQuery, TResponse> innerHandler,
        IEnumerable<IValidator<TQuery>> validators)
        : IQueryHandler<TQuery, TResponse>
        where TQuery : IQuery<TResponse>
    {
        public async Task<Result<TResponse>> Handle(
            TQuery query,
            CancellationToken cancellationToken)
        {
            Error? error = await ValidateAsync(query, validators, cancellationToken);
            if (error is not null)
            {
                return Result.Failure<TResponse>(error);
            }

            return await innerHandler.Handle(query, cancellationToken);
        }
    }

    private static async Task<Error?> ValidateAsync<T>(
        T request,
        IEnumerable<IValidator<T>> validators,
        CancellationToken cancellationToken)
    {
        if (!validators.Any())
        {
            return null;
        }

        ValidationContext<T> context = new(request);
        ValidationResult[] results = await Task.WhenAll(
            validators.Select(validator => validator.ValidateAsync(context, cancellationToken)));

        ValidationFailure? failure = results
            .Where(result => !result.IsValid)
            .SelectMany(result => result.Errors)
            .FirstOrDefault();

        return failure is null
            ? null
            : ErrorCatalog.InvalidRequest(failure.ErrorMessage);
    }
}
