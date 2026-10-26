namespace Jobriq.Web.Identity;

internal sealed class ClientContextMiddleware(RequestDelegate next)
{
    public const string CookieName = "jobriq_client";

    public async Task InvokeAsync(HttpContext context, CookieClientContext clientContext)
    {
        bool hasClientCookie = TryResolveClientId(context, out Guid clientId);
        if (!hasClientCookie)
        {
            clientId = Guid.NewGuid();
        }

        clientContext.Assign(clientId);

        if (!hasClientCookie)
        {
            context.Response.Cookies.Append(
                CookieName,
                clientId.ToString(),
                new CookieOptions
                {
                    HttpOnly = true,
                    IsEssential = true,
                    MaxAge = TimeSpan.FromDays(365),
                    Path = "/",
                    SameSite = SameSiteMode.Lax,
                    Secure = context.Request.IsHttps
                });
        }

        await next(context);
    }

    private static bool TryResolveClientId(HttpContext context, out Guid clientId)
    {
        clientId = Guid.Empty;

        return context.Request.Cookies.TryGetValue(CookieName, out string? value)
            && Guid.TryParse(value, out clientId)
            && clientId != Guid.Empty;
    }
}
