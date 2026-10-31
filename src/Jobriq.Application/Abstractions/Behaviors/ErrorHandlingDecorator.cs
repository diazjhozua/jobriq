using Jobriq.Application.Abstractions.Messaging;
using Jobriq.Application.Common.Errors;
using Jobriq.SharedKernel;
using Microsoft.Extensions.Logging;

namespace Jobriq.Application.Abstractions.Behaviors;

internal static class ErrorHandlingDecorator
{
    internal sealed class CommandHandler<TCommand, TResponse>(
        ICommandHandler<TCommand, TResponse> innerHandler,
        ILogger<CommandHandler<TCommand, TResponse>> logger)
        : ICommandHandler<TCommand, TResponse>
        where TCommand : ICommand<TResponse>
    {
        public async Task<Result<TResponse>> Handle(
            TCommand command,
            CancellationToken cancellationToken)
        {
            try
            {
                return await innerHandler.Handle(command, cancellationToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                if (ExceptionErrorMapper.TryMap(exception, out Error error))
                {
                    Log(logger, exception, error);
                    return Result.Failure<TResponse>(error);
                }

                throw;
            }
        }
    }

    internal sealed class CommandBaseHandler<TCommand>(
        ICommandHandler<TCommand> innerHandler,
        ILogger<CommandBaseHandler<TCommand>> logger)
        : ICommandHandler<TCommand>
        where TCommand : ICommand
    {
        public async Task<Result> Handle(TCommand command, CancellationToken cancellationToken)
        {
            try
            {
                return await innerHandler.Handle(command, cancellationToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                if (ExceptionErrorMapper.TryMap(exception, out Error error))
                {
                    Log(logger, exception, error);
                    return Result.Failure(error);
                }

                throw;
            }
        }
    }

    internal sealed class QueryHandler<TQuery, TResponse>(
        IQueryHandler<TQuery, TResponse> innerHandler,
        ILogger<QueryHandler<TQuery, TResponse>> logger)
        : IQueryHandler<TQuery, TResponse>
        where TQuery : IQuery<TResponse>
    {
        public async Task<Result<TResponse>> Handle(
            TQuery query,
            CancellationToken cancellationToken)
        {
            try
            {
                return await innerHandler.Handle(query, cancellationToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                if (ExceptionErrorMapper.TryMap(exception, out Error error))
                {
                    Log(logger, exception, error);
                    return Result.Failure<TResponse>(error);
                }

                throw;
            }
        }
    }

    private static void Log(ILogger logger, Exception exception, Error error)
    {
        int status = error.StatusCode ?? 500;

        if (status >= 500)
        {
            logger.LogError(exception, "Handler failed with {Code}.", error.Code);
        }
        else
        {
            logger.LogWarning(exception, "Handler failed with {Code}.", error.Code);
        }
    }
}
