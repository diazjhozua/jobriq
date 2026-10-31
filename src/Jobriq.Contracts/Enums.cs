namespace Jobriq.Contracts;

public enum SummaryTypeDto
{
    Objective,
    Professional
}

public enum ApplicationStatusDto
{
    Saved,
    Applied,
    Interviewing,
    Offer,
    Rejected
}

public enum ReviewSectionDto
{
    Personal,
    Summary,
    Experience,
    Education,
    Skills,
    Projects,
    Certifications,
    Awards
}

public enum ReviewCategoryDto
{
    Completeness,
    Impact,
    Clarity
}

public enum ExportFormatDto
{
    Docx,
    Markdown
}
