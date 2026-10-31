using Jobriq.Contracts;
using Jobriq.Domain.Applications;

namespace Jobriq.Application.Common.Mapping;

public static class CoverLetterMappings
{
    public static CoverLetter ToDomain(CoverLetterDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        return new CoverLetter
        {
            Personal = dto.Personal is null ? null! : ProfileMappings.ToDomain(dto.Personal),
            Company = dto.Company,
            Role = dto.Role,
            Salutation = dto.Salutation,
            Paragraphs = dto.Paragraphs is null ? null! : [.. dto.Paragraphs],
            Closing = dto.Closing,
            Signature = dto.Signature,
            GeneratedAt = dto.GeneratedAt
        };
    }

    public static CoverLetterDto ToDto(CoverLetter letter)
    {
        ArgumentNullException.ThrowIfNull(letter);

        return new CoverLetterDto
        {
            Personal = letter.Personal is null ? null : ProfileMappings.ToDto(letter.Personal),
            Company = letter.Company,
            Role = letter.Role,
            Salutation = letter.Salutation,
            Paragraphs = letter.Paragraphs is null ? null : [.. letter.Paragraphs],
            Closing = letter.Closing,
            Signature = letter.Signature,
            GeneratedAt = letter.GeneratedAt
        };
    }
}
