using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Jobriq.Application.Abstractions;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.Resumes;
using static Jobriq.Infrastructure.Export.DocxTheme;

namespace Jobriq.Infrastructure.Export;

public sealed class DocxResumeExporter : IResumeExporter
{
    public ExportFormat Format => ExportFormat.Docx;

    public string ContentType => "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    public byte[] Export(GeneratedResume resume)
    {
        using MemoryStream stream = new();

        using (WordprocessingDocument document = WordprocessingDocument.Create(
            stream,
            WordprocessingDocumentType.Document))
        {
            MainDocumentPart mainPart = document.AddMainDocumentPart();
            mainPart.Document = new Document();
            Body body = mainPart.Document.AppendChild(new Body());

            AddStyles(mainPart);
            AddNumbering(mainPart);

            AddHeader(body, resume.Personal);
            AddSummary(body, resume);
            AddExperience(body, resume);
            AddEducation(body, resume);
            AddSkills(body, resume);
            AddProjects(body, resume);

            AddPageSettings(body);
        }

        return stream.ToArray();
    }

    private static void AddNumbering(MainDocumentPart mainPart)
    {
        NumberingDefinitionsPart numberingPart = mainPart.AddNewPart<NumberingDefinitionsPart>();
        numberingPart.Numbering = new Numbering(
            new AbstractNum(
                new Level(
                    new NumberingFormat { Val = NumberFormatValues.Bullet },
                    new LevelText { Val = "•" },
                    new LevelJustification { Val = LevelJustificationValues.Left },
                    new PreviousParagraphProperties(
                        new Indentation { Left = "720", Hanging = "360" }),
                    new RunProperties(
                        new RunFonts { Ascii = "Symbol", HighAnsi = "Symbol" },
                        new FontSize { Val = BodySize }))
                { LevelIndex = 0 })
            { AbstractNumberId = 1 },
            new NumberingInstance(new AbstractNumId { Val = 1 }) { NumberID = 1 });
    }

    private static void AddSummary(Body body, GeneratedResume resume)
    {
        if (string.IsNullOrEmpty(resume.Summary))
        {
            return;
        }

        AddSectionHeading(body, "Professional Summary");
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { After = "200" }),
            CreateRun(resume.Summary, BodySize, TextColor)));
    }

    private static void AddExperience(Body body, GeneratedResume resume)
    {
        List<GeneratedExperience> active = [.. resume.Experience.Where(experience =>
            !string.IsNullOrEmpty(experience.Company)
            || !string.IsNullOrEmpty(experience.Title)
            || experience.Bullets.Count > 0)];
        if (active.Count == 0)
        {
            return;
        }

        AddSectionHeading(body, "Work Experience");

        foreach (GeneratedExperience experience in active)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { Before = "160", After = "60" }),
                CreateRun($"{experience.Title} — {experience.Company}", BodySize, TextColor, bold: true),
                CreateRun($"   {experience.StartDate} – {experience.EndDate}", SmallSize, MutedColor)));

            foreach (EnhancedBullet bullet in experience.Bullets)
            {
                body.Append(BulletParagraph(bullet.Enhanced));
            }
        }
    }

    private static void AddEducation(Body body, GeneratedResume resume)
    {
        List<Education> active = [.. resume.Education.Where(education =>
            !string.IsNullOrEmpty(education.School) || !string.IsNullOrEmpty(education.Degree))];
        if (active.Count == 0)
        {
            return;
        }

        AddSectionHeading(body, "Education");

        foreach (Education education in active)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { Before = "160", After = "60" }),
                CreateRun($"{education.Degree} in {education.Field} — {education.School}", BodySize, TextColor, bold: true),
                CreateRun($"   {education.StartDate} – {education.EndDate}", SmallSize, MutedColor)));

            if (!string.IsNullOrEmpty(education.Gpa))
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
                    CreateRun($"GPA: {education.Gpa}", BodySize, MutedColor)));
            }
        }
    }

    private static void AddSkills(Body body, GeneratedResume resume)
    {
        if (resume.Skills.Count == 0)
        {
            return;
        }

        AddSectionHeading(body, "Skills");
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { After = "200" }),
            CreateRun(string.Join(", ", resume.Skills), BodySize, TextColor)));
    }

    private static void AddProjects(Body body, GeneratedResume resume)
    {
        List<GeneratedProject> active = [.. resume.Projects.Where(project =>
            !string.IsNullOrEmpty(project.Name) && project.Bullets.Count > 0)];
        if (active.Count == 0)
        {
            return;
        }

        AddSectionHeading(body, "Projects");

        foreach (GeneratedProject project in active)
        {
            string header = string.IsNullOrEmpty(project.Url)
                ? project.Name
                : $"{project.Name} — {project.Url}";

            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { Before = "160", After = "60" }),
                CreateRun(header, BodySize, TextColor, bold: true)));

            foreach (EnhancedBullet bullet in project.Bullets)
            {
                body.Append(BulletParagraph(bullet.Enhanced));
            }
        }
    }

    private static void AddSectionHeading(Body body, string text)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { Before = "240", After = "60" }),
            CreateRun(text, HeadingSize, TextColor, bold: true)));

        AddRule(body);
    }

    private static Paragraph BulletParagraph(string text) =>
        new(
            new ParagraphProperties(
                new NumberingProperties(
                    new NumberingLevelReference { Val = 0 },
                    new NumberingId { Val = 1 }),
                new SpacingBetweenLines { After = "40" }),
            CreateRun(text, BodySize, TextColor));
}
