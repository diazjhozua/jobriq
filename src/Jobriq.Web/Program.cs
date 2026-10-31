using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Jobriq.Application;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Infrastructure;
using Jobriq.Web.Endpoints;
using Jobriq.Web.Extensions;
using Jobriq.Web.Identity;
using Jobriq.Web.Infrastructure;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(
    builder.Configuration,
    builder.Environment.IsEnvironment("Testing"));
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddScoped<CookieClientContext>();
builder.Services.AddScoped<IClientContext>(
    services => services.GetRequiredService<CookieClientContext>());
builder.Services.AddEndpoints(Assembly.GetExecutingAssembly());

WebApplication app = builder.Build();

app.ApplyMigrations();
app.UseExceptionHandler();
app.UseMiddleware<ClientContextMiddleware>();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapEndpoints(app.MapGroup("/api"));

app.MapFallback(async context =>
{
    if (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    string indexPath = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "index.html");
    if (!File.Exists(indexPath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.SendFileAsync(indexPath);
});

app.Run();

public partial class Program;
