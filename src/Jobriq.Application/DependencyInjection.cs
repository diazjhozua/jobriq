using FluentValidation;
using Jobriq.Application.Abstractions.Behaviors;
using Jobriq.Application.Abstractions.Messaging;
using Microsoft.Extensions.DependencyInjection;
using Scrutor;

namespace Jobriq.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);

        services.Scan(scan => scan
            .FromAssembliesOf(typeof(DependencyInjection))
            .AddClasses(classes => classes.AssignableTo(typeof(ICommandHandler<>)), publicOnly: false)
                .AsImplementedInterfaces()
                .WithScopedLifetime()
            .AddClasses(classes => classes.AssignableTo(typeof(ICommandHandler<,>)), publicOnly: false)
                .AsImplementedInterfaces()
                .WithScopedLifetime()
            .AddClasses(classes => classes.AssignableTo(typeof(IQueryHandler<,>)), publicOnly: false)
                .AsImplementedInterfaces()
                .WithScopedLifetime());

        services.Decorate(typeof(ICommandHandler<>), typeof(ErrorHandlingDecorator.CommandBaseHandler<>));
        services.Decorate(typeof(ICommandHandler<,>), typeof(ErrorHandlingDecorator.CommandHandler<,>));
        services.Decorate(typeof(IQueryHandler<,>), typeof(ErrorHandlingDecorator.QueryHandler<,>));

        services.Decorate(typeof(ICommandHandler<>), typeof(ValidationDecorator.CommandBaseHandler<>));
        services.Decorate(typeof(ICommandHandler<,>), typeof(ValidationDecorator.CommandHandler<,>));
        services.Decorate(typeof(IQueryHandler<,>), typeof(ValidationDecorator.QueryHandler<,>));

        services.AddValidatorsFromAssembly(
            typeof(DependencyInjection).Assembly,
            includeInternalTypes: true);

        return services;
    }
}
