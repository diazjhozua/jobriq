using Jobriq.Application.Abstractions.Persistence;

namespace Jobriq.Web.Identity;

internal sealed class CookieClientContext : IClientContext
{
    public Guid ClientId { get; private set; }

    public void Assign(Guid clientId)
    {
        if (clientId == Guid.Empty)
        {
            throw new ArgumentException("A client id is required.", nameof(clientId));
        }

        ClientId = clientId;
    }
}
