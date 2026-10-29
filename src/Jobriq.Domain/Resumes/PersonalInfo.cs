using System.Text.Json.Serialization;

namespace Jobriq.Domain.Resumes;

public sealed class PersonalInfo
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("linkedin")]
    public string? LinkedIn { get; set; }

    [JsonPropertyName("github")]
    public string? GitHub { get; set; }

    public string? Website { get; set; }

    public PersonalInfo Clone() => new()
    {
        Name = Name,
        Email = Email,
        Phone = Phone,
        Location = Location,
        LinkedIn = LinkedIn,
        GitHub = GitHub,
        Website = Website
    };
}
