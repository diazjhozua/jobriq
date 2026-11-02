using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Jobriq.Application.Abstractions;
using Jobriq.Application.Resumes.ExportResume;
using Jobriq.Domain.ResumeThemes;
using Jobriq.Domain.Resumes;

namespace Jobriq.Infrastructure.Export;

public sealed class DocxResumeExporter : IResumeExporter
{
    public ExportFormat Format => ExportFormat.Docx;

    public string ContentType => "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    public byte[] Export(GeneratedResume resume, ResumeThemeDefinition theme)
    {
        ArgumentNullException.ThrowIfNull(theme);

        DocxTheme docxTheme = new(theme.Styles);
        using MemoryStream stream = new();

        using (WordprocessingDocument document = WordprocessingDocument.Create(
            stream,
            WordprocessingDocumentType.Document))
        {
            MainDocumentPart mainPart = document.AddMainDocumentPart();
            mainPart.Document = new Document();
            Body body = mainPart.Document.AppendChild(new Body());

            docxTheme.AddStyles(mainPart);
            AddNumbering(mainPart, docxTheme);

            docxTheme.AddHeader(body, resume.Personal);
            AddSummary(body, resume, docxTheme);
            AddExperience(body, resume, docxTheme);
            AddEducation(body, resume, docxTheme);
            AddCertifications(body, resume, docxTheme);
            AddAwards(body, resume, docxTheme);
            AddSkills(body, resume, docxTheme);
            AddProjects(body, resume, docxTheme);

            docxTheme.AddPageSettings(body);
        }

        return stream.ToArray();
    }

    private static void AddNumbering(MainDocumentPart mainPart, DocxTheme theme)
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
                        new FontSize { Val = theme.BodySize }))
                { LevelIndex = 0 })
            { AbstractNumberId = 1 },
            new NumberingInstance(new AbstractNumId { Val = 1 }) { NumberID = 1 });
    }

    private static void AddSummary(Body body, GeneratedResume resume, DocxTheme theme)
    {
        if (string.IsNullOrEmpty(resume.Summary))
        {
            return;
        }

        theme.AddSectionHeading(body, "Professional Summary");
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { After = "200" }),
            theme.CreateRun(resume.Summary, theme.BodySize, theme.TextColor)));
    }

    private static void AddExperience(Body body, GeneratedResume resume, DocxTheme theme)
    {
        List<GeneratedExperience> active = [.. resume.Experience.Where(experience =>
            !string.IsNullOrEmpty(experience.Company)
            || !string.IsNullOrEmpty(experience.Title)
            || experience.Bullets.Count > 0)];
        if (active.Count == 0)
        {
            return;
        }

        theme.AddSectionHeading(body, "Work Experience");

        foreach (GeneratedExperience experience in active)
        {
            List<OpenXmlElement> runs =
            [
                theme.CreateRun(
                    $"{experience.Title} — {experience.Company}",
                    theme.BodySize,
                    theme.TextColor,
                    bold: true)
            ];

            string dates = ResumeExportText.DateRange(experience.StartDate, experience.EndDate);
            if (dates.Length > 0)
            {
                runs.Add(theme.CreateRun($"   {dates}", theme.SmallSize, theme.MutedColor));
            }

            Paragraph experienceHeader = new(
                new ParagraphProperties(new SpacingBetweenLines { Before = "160", After = "60" }));
            experienceHeader.Append(runs.ToArray());
            body.Append(experienceHeader);

            foreach (EnhancedBullet bullet in experience.Bullets)
            {
                body.Append(BulletParagraph(bullet.Enhanced, theme));
            }
        }
    }

    private static void AddEducation(Body body, GeneratedResume resume, DocxTheme theme)
    {
        List<Education> active = [.. resume.Education.Where(education =>
            !string.IsNullOrEmpty(education.School) || !string.IsNullOrEmpty(education.Degree))];
        if (active.Count == 0)
        {
            return;
        }

        theme.AddSectionHeading(body, "Education");

        foreach (Education education in active)
        {
            List<OpenXmlElement> runs =
            [
                theme.CreateRun(
                    $"{education.Degree} in {education.Field} — {education.School}",
                    theme.BodySize,
                    theme.TextColor,
                    bold: true)
            ];

            string dates = ResumeExportText.DateRange(education.StartDate, education.EndDate);
            if (dates.Length > 0)
            {
                runs.Add(theme.CreateRun($"   {dates}", theme.SmallSize, theme.MutedColor));
            }

            Paragraph educationHeader = new(
                new ParagraphProperties(new SpacingBetweenLines { Before = "160", After = "60" }));
            educationHeader.Append(runs.ToArray());
            body.Append(educationHeader);

            if (!string.IsNullOrEmpty(education.Gpa))
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
                    theme.CreateRun($"GPA: {education.Gpa}", theme.BodySize, theme.MutedColor)));
            }
        }
    }

    private static void AddCertifications(Body body, GeneratedResume resume, DocxTheme theme)
    {
        List<Certification> active = [.. resume.Certifications.Where(
            certification => ResumeExportText.HasContent(certification))];
        if (active.Count == 0)
        {
            return;
        }

        theme.AddSectionHeading(body, "Licenses & Certifications");

        foreach (Certification certification in active)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { Before = "160", After = "60" }),
                theme.CreateRun(
                    ResumeExportText.CertificationHeader(certification),
                    theme.BodySize,
                    theme.TextColor,
                    bold: true)));

            string meta = ResumeExportText.CertificationMeta(certification);
            if (meta.Length > 0)
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
                    theme.CreateRun(meta, theme.SmallSize, theme.MutedColor)));
            }
        }
    }

    private static void AddAwards(Body body, GeneratedResume resume, DocxTheme theme)
    {
        List<Award> active = [.. resume.Awards.Where(
            award => ResumeExportText.HasContent(award))];
        if (active.Count == 0)
        {
            return;
        }

        theme.AddSectionHeading(body, "Honors & Awards");

        foreach (Award award in active)
        {
            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { Before = "160", After = "60" }),
                theme.CreateRun(
                    ResumeExportText.AwardHeader(award),
                    theme.BodySize,
                    theme.TextColor,
                    bold: true)));

            string meta = ResumeExportText.AwardMeta(award);
            if (meta.Length > 0)
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
                    theme.CreateRun(meta, theme.SmallSize, theme.MutedColor)));
            }

            if (!string.IsNullOrWhiteSpace(award.Description))
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "60" }),
                    theme.CreateRun(award.Description.Trim(), theme.BodySize, theme.TextColor)));
            }
        }
    }

    private static void AddSkills(Body body, GeneratedResume resume, DocxTheme theme)
    {
        if (resume.Skills.Count == 0)
        {
            return;
        }

        theme.AddSectionHeading(body, "Skills");
        body.Append(new Paragraph(
            new ParagraphProperties(new SpacingBetweenLines { After = "200" }),
            theme.CreateRun(string.Join(", ", resume.Skills), theme.BodySize, theme.TextColor)));
    }

    private static void AddProjects(Body body, GeneratedResume resume, DocxTheme theme)
    {
        List<GeneratedProject> active = [.. resume.Projects.Where(project =>
            !string.IsNullOrEmpty(project.Name)
            && (project.Bullets.Count > 0 || ResumeExportText.ProjectMeta(project).Length > 0))];
        if (active.Count == 0)
        {
            return;
        }

        theme.AddSectionHeading(body, "Projects");

        foreach (GeneratedProject project in active)
        {
            string header = string.IsNullOrEmpty(project.Url)
                ? project.Name
                : $"{project.Name} — {project.Url}";

            body.Append(new Paragraph(
                new ParagraphProperties(new SpacingBetweenLines { Before = "160", After = "60" }),
                theme.CreateRun(header, theme.BodySize, theme.TextColor, bold: true)));

            string meta = ResumeExportText.ProjectMeta(project);
            if (meta.Length > 0)
            {
                body.Append(new Paragraph(
                    new ParagraphProperties(new SpacingBetweenLines { After = "40" }),
                    theme.CreateRun(meta, theme.SmallSize, theme.MutedColor)));
            }

            foreach (EnhancedBullet bullet in project.Bullets)
            {
                body.Append(BulletParagraph(bullet.Enhanced, theme));
            }
        }
    }

    private static Paragraph BulletParagraph(string text, DocxTheme theme) =>
        new(
            new ParagraphProperties(
                new NumberingProperties(
                    new NumberingLevelReference { Val = 0 },
                    new NumberingId { Val = 1 }),
                new SpacingBetweenLines { After = "40" }),
            theme.CreateRun(text, theme.BodySize, theme.TextColor));
}
