using System.Data.Common;
using System.Text.Json;
using Jobriq.Application.Abstractions.Persistence;
using Jobriq.Domain.Applications;
using Jobriq.Domain.Resumes;
using Jobriq.Domain.State;
using Jobriq.Infrastructure.Persistence.Postgres.Rows;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Jobriq.Infrastructure.Persistence.Postgres;

internal sealed class PostgresJobriqRepository(
    JobriqDbContext dbContext,
    TimeProvider timeProvider) : IJobriqRepository
{
    public Task<JobriqState> GetStateAsync(Guid clientId, CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ProfileRow? profileRow = await dbContext.Profiles
                .AsNoTracking()
                .SingleOrDefaultAsync(row => row.ClientId == clientId, cancellationToken);

            List<ApplicationRow> applicationRows = await dbContext.Applications
                .AsNoTracking()
                .Where(row => row.ClientId == clientId)
                .OrderByDescending(row => row.CreatedAt)
                .ToListAsync(cancellationToken);

            ResumeProfile profile = profileRow?.ProfileJson is null
                ? new ResumeProfile()
                : Deserialize<ResumeProfile>(profileRow.ProfileJson);

            GeneratedResume? standaloneResume = profileRow?.StandaloneResumeJson is null
                ? null
                : Deserialize<GeneratedResume>(profileRow.StandaloneResumeJson);

            return new JobriqState(
                profile,
                [.. applicationRows.Select(ToDomain)],
                standaloneResume);
        });

    public Task SaveProfileAsync(
        Guid clientId,
        ResumeProfile profile,
        CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ProfileRow? row = await dbContext.Profiles
                .SingleOrDefaultAsync(candidate => candidate.ClientId == clientId, cancellationToken);

            string json = Serialize(profile);
            DateTimeOffset now = timeProvider.GetUtcNow();

            if (row is null)
            {
                dbContext.Profiles.Add(new ProfileRow
                {
                    ClientId = clientId,
                    ProfileJson = json,
                    UpdatedAt = now
                });
            }
            else
            {
                row.ProfileJson = json;
                row.UpdatedAt = now;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
        });

    public Task<ResumeProfile> GetProfileAsync(Guid clientId, CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ProfileRow? row = await dbContext.Profiles
                .AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.ClientId == clientId, cancellationToken);

            return row?.ProfileJson is null
                ? new ResumeProfile()
                : Deserialize<ResumeProfile>(row.ProfileJson);
        });

    public Task<JobApplication> AddApplicationAsync(
        Guid clientId,
        JobApplication application,
        CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            dbContext.Applications.Add(new ApplicationRow
            {
                Id = application.Id,
                ClientId = clientId,
                Company = application.Company,
                Role = application.Role,
                JobDescription = application.JobDescription,
                Status = application.Status.ToString(),
                CreatedAt = application.CreatedAt,
                AppliedDate = application.AppliedDate,
                GeneratedResumeJson = application.GeneratedResume is null
                    ? null
                    : Serialize(application.GeneratedResume),
                CoverLetterJson = application.CoverLetter is null
                    ? null
                    : Serialize(application.CoverLetter),
                UpdatedAt = timeProvider.GetUtcNow()
            });

            await dbContext.SaveChangesAsync(cancellationToken);

            return application;
        });

    public Task<JobApplication?> GetApplicationAsync(
        Guid clientId,
        Guid applicationId,
        CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ApplicationRow? row = await dbContext.Applications
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    candidate => candidate.Id == applicationId && candidate.ClientId == clientId,
                    cancellationToken);

            return row is null ? null : ToDomain(row);
        });

    public Task<JobApplication?> UpdateStatusAsync(
        Guid clientId,
        Guid applicationId,
        ApplicationStatus status,
        CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ApplicationRow? row = await FindApplicationAsync(clientId, applicationId, cancellationToken);
            if (row is null)
            {
                return null;
            }

            row.Status = status.ToString();
            row.UpdatedAt = timeProvider.GetUtcNow();
            await dbContext.SaveChangesAsync(cancellationToken);

            return ToDomain(row);
        });

    public Task<JobApplication?> UpdateApplicationDetailsAsync(
        Guid clientId,
        Guid applicationId,
        string company,
        string role,
        DateOnly? appliedDate,
        CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ApplicationRow? row = await FindApplicationAsync(clientId, applicationId, cancellationToken);
            if (row is null)
            {
                return null;
            }

            row.Company = company.Trim();
            row.Role = role.Trim();
            row.AppliedDate = appliedDate;
            row.UpdatedAt = timeProvider.GetUtcNow();
            await dbContext.SaveChangesAsync(cancellationToken);

            return ToDomain(row);
        });

    public Task<bool> DeleteApplicationAsync(
        Guid clientId,
        Guid applicationId,
        CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ApplicationRow? row = await FindApplicationAsync(clientId, applicationId, cancellationToken);
            if (row is null)
            {
                return false;
            }

            dbContext.Applications.Remove(row);
            await dbContext.SaveChangesAsync(cancellationToken);

            return true;
        });

    public Task<JobApplication?> SaveGeneratedResumeAsync(
        Guid clientId,
        Guid applicationId,
        GeneratedResume resume,
        CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ApplicationRow? row = await FindApplicationAsync(clientId, applicationId, cancellationToken);
            if (row is null)
            {
                return null;
            }

            row.GeneratedResumeJson = Serialize(resume);
            row.UpdatedAt = timeProvider.GetUtcNow();
            await dbContext.SaveChangesAsync(cancellationToken);

            return ToDomain(row);
        });

    public Task<GeneratedResume?> SaveStandaloneResumeAsync(
        Guid clientId,
        GeneratedResume resume,
        CancellationToken cancellationToken) =>
        GuardAsync<GeneratedResume?>(async () =>
        {
            ProfileRow? row = await dbContext.Profiles
                .SingleOrDefaultAsync(candidate => candidate.ClientId == clientId, cancellationToken);

            string json = Serialize(resume);
            DateTimeOffset now = timeProvider.GetUtcNow();

            if (row is null)
            {
                dbContext.Profiles.Add(new ProfileRow
                {
                    ClientId = clientId,
                    StandaloneResumeJson = json,
                    UpdatedAt = now
                });
            }
            else
            {
                row.StandaloneResumeJson = json;
                row.UpdatedAt = now;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return resume;
        });

    public Task<JobApplication?> SaveCoverLetterAsync(
        Guid clientId,
        Guid applicationId,
        CoverLetter letter,
        CancellationToken cancellationToken) =>
        GuardAsync(async () =>
        {
            ApplicationRow? row = await FindApplicationAsync(clientId, applicationId, cancellationToken);
            if (row is null)
            {
                return null;
            }

            row.CoverLetterJson = Serialize(letter);
            row.UpdatedAt = timeProvider.GetUtcNow();
            await dbContext.SaveChangesAsync(cancellationToken);

            return ToDomain(row);
        });

    private Task<ApplicationRow?> FindApplicationAsync(
        Guid clientId,
        Guid applicationId,
        CancellationToken cancellationToken) =>
        dbContext.Applications.SingleOrDefaultAsync(
            row => row.Id == applicationId && row.ClientId == clientId,
            cancellationToken);

    private static JobApplication ToDomain(ApplicationRow row) =>
        JobApplication.Restore(
            row.Id,
            row.Company,
            row.Role,
            row.JobDescription,
            Enum.Parse<ApplicationStatus>(row.Status),
            row.CreatedAt,
            row.GeneratedResumeJson is null
                ? null
                : Deserialize<GeneratedResume>(row.GeneratedResumeJson),
            row.CoverLetterJson is null
                ? null
                : Deserialize<CoverLetter>(row.CoverLetterJson),
            row.AppliedDate);

    private static string Serialize<T>(T value) =>
        JsonSerializer.Serialize(value, JobriqJson.Options);

    private static T Deserialize<T>(string json) =>
        JsonSerializer.Deserialize<T>(json, JobriqJson.Options)
        ?? throw new InvalidOperationException($"Could not deserialize stored {typeof(T).Name} JSON.");

    private static async Task<T> GuardAsync<T>(Func<Task<T>> operation)
    {
        try
        {
            return await operation();
        }
        catch (Exception exception) when (IsUnavailable(exception))
        {
            throw new JobriqPersistenceUnavailableException(
                "The jobriq database is unavailable.",
                exception);
        }
    }

    private static async Task GuardAsync(Func<Task> operation)
    {
        try
        {
            await operation();
        }
        catch (Exception exception) when (IsUnavailable(exception))
        {
            throw new JobriqPersistenceUnavailableException(
                "The jobriq database is unavailable.",
                exception);
        }
    }

    private static bool IsUnavailable(Exception exception) =>
        exception is NpgsqlException or DbException;
}
