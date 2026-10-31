using FluentValidation.Results;
using Jobriq.Application.Applications.Create;
using Jobriq.Application.Applications.SaveGeneratedResume;
using Jobriq.Application.Applications.UpdateDetails;
using Jobriq.Application.Applications.UpdateStatus;
using Jobriq.Application.CoverLetters.Export;
using Jobriq.Application.Profiles.GenerateStandaloneResume;
using Jobriq.Application.Profiles.Review;
using Jobriq.Application.Profiles.Save;
using Jobriq.Application.Resumes.Export;
using Jobriq.Application.Resumes.Generate;
using Jobriq.Contracts;
using Shouldly;

namespace Jobriq.Application.Tests.Validators;

public sealed class CommandValidatorTests
{
    [Fact]
    public void CreateApplication_ValidCommand_Passes()
    {
        new CreateApplicationCommandValidator()
            .Validate(new CreateApplicationCommand("Acme", "Engineer", "", null, null))
            .IsValid.ShouldBeTrue();
    }

    [Fact]
    public void CreateApplication_WithoutCompany_Fails()
    {
        AssertSingle(
            new CreateApplicationCommandValidator().Validate(
                new CreateApplicationCommand("", "Engineer", "", null, null)),
            "Company and role are required.");
    }

    [Fact]
    public void CreateApplication_UnknownStatus_Fails()
    {
        AssertSingle(
            new CreateApplicationCommandValidator().Validate(
                new CreateApplicationCommand(
                    "Acme",
                    "Engineer",
                    "",
                    (ApplicationStatusDto)99,
                    null)),
            "Unknown application status.");
    }

    [Fact]
    public void CreateApplication_InvalidDate_Fails()
    {
        AssertSingle(
            new CreateApplicationCommandValidator().Validate(
                new CreateApplicationCommand("Acme", "Engineer", "", null, "August 2022")),
            "Date applied must be a valid date.");
    }

    [Fact]
    public void UpdateDetails_WithoutRole_Fails()
    {
        AssertSingle(
            new UpdateApplicationDetailsCommandValidator().Validate(
                new UpdateApplicationDetailsCommand(TestData.ApplicationId, "Acme", "", null)),
            "Company and role are required.");
    }

    [Fact]
    public void UpdateDetails_InvalidDate_Fails()
    {
        AssertSingle(
            new UpdateApplicationDetailsCommandValidator().Validate(
                new UpdateApplicationDetailsCommand(
                    TestData.ApplicationId,
                    "Acme",
                    "Engineer",
                    "August 2022")),
            "Date applied must be a valid date.");
    }

    [Fact]
    public void UpdateStatus_WithoutStatus_Fails()
    {
        AssertSingle(
            new UpdateApplicationStatusCommandValidator().Validate(
                new UpdateApplicationStatusCommand(TestData.ApplicationId, null)),
            "A status is required.");
    }

    [Fact]
    public void UpdateStatus_UnknownStatus_Fails()
    {
        AssertSingle(
            new UpdateApplicationStatusCommandValidator().Validate(
                new UpdateApplicationStatusCommand(TestData.ApplicationId, (ApplicationStatusDto)99)),
            "Unknown application status.");
    }

    [Fact]
    public void SaveGeneratedResume_WithoutResume_Fails()
    {
        AssertSingle(
            new SaveGeneratedResumeCommandValidator().Validate(
                new SaveGeneratedResumeCommand(TestData.ApplicationId, null)),
            "A generated resume is required.");
    }

    [Fact]
    public void SaveProfile_WithoutProfile_Fails()
    {
        AssertSingle(
            new SaveProfileCommandValidator().Validate(new SaveProfileCommand(null)),
            "A complete profile is required.");
    }

    [Fact]
    public void SaveProfile_WithNullCertifications_Fails()
    {
        ProfileDto profile = TestData.Profile();
        profile.Certifications = null;

        AssertSingle(
            new SaveProfileCommandValidator().Validate(new SaveProfileCommand(profile)),
            "A complete profile is required.");
    }

    [Fact]
    public void ReviewProfile_WithoutProfile_Fails()
    {
        AssertSingle(
            new ReviewProfileCommandValidator().Validate(new ReviewProfileCommand(null)),
            "A complete profile is required.");
    }

    [Fact]
    public void GenerateStandaloneResume_WithoutProfile_Fails()
    {
        AssertSingle(
            new GenerateStandaloneResumeCommandValidator().Validate(
                new GenerateStandaloneResumeCommand(null, null)),
            "A complete profile is required.");
    }

    [Fact]
    public void GenerateResume_WithoutProfile_Fails()
    {
        AssertSingle(
            new GenerateResumeCommandValidator().Validate(
                new GenerateResumeCommand(null, null)),
            "A profile is required.");
    }

    [Fact]
    public void GenerateResume_OnlyChecksProfilePresence()
    {
        ProfileDto profile = TestData.Profile();
        profile.Certifications = null;

        new GenerateResumeCommandValidator()
            .Validate(new GenerateResumeCommand(profile, null))
            .IsValid.ShouldBeTrue();
    }

    [Fact]
    public void ExportResume_WithoutResume_Fails()
    {
        AssertSingle(
            new ExportResumeQueryValidator().Validate(
                new ExportResumeQuery(null, ExportFormatDto.Docx)),
            "A generated resume is required.");
    }

    [Fact]
    public void ExportCoverLetter_WithoutLetter_Fails()
    {
        AssertSingle(
            new ExportCoverLetterQueryValidator().Validate(new ExportCoverLetterQuery(null)),
            "A cover letter is required.");
    }

    [Fact]
    public void ExportCoverLetter_WithoutName_Fails()
    {
        CoverLetterDto letter = TestData.CoverLetter();
        letter.Personal!.Name = string.Empty;

        AssertSingle(
            new ExportCoverLetterQueryValidator().Validate(new ExportCoverLetterQuery(letter)),
            "The cover letter is missing required content.");
    }

    [Fact]
    public void ExportCoverLetter_WithoutParagraphs_Fails()
    {
        CoverLetterDto letter = TestData.CoverLetter();
        letter.Paragraphs = null;

        AssertSingle(
            new ExportCoverLetterQueryValidator().Validate(new ExportCoverLetterQuery(letter)),
            "The cover letter is missing required content.");
    }

    private static void AssertSingle(ValidationResult result, string message)
    {
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldHaveSingleItem().ErrorMessage.ShouldBe(message);
    }
}
