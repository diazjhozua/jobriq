namespace Jobriq.Application.Resumes.ExportResume;

public sealed record ExportedFile(byte[] Content, string FileName, string ContentType);
