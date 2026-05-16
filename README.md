# Jobriq

AI-powered resume builder CLI. Fill a plain-text template, let AI enhance your bullets and summary, pick a design, export `.md` + `.docx`.

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)]()

---

## Features

- **AI bullet enhancement** — transforms raw experience into strong, action-verb bullets with quantification prompts
- **Auto-generated summary** — objective or professional summary from your experience
- **ATS keyword matching** — paste a job description to see matched/missing keywords
- **Interactive feedback loop** — refine anything in plain English before exporting
- **5 built-in designs** — classic, modern, minimal, executive, harvard
- **Custom themes** — drop a JSON file into `themes/` to define your own design
- **Export to `.md` + `.docx`** — timestamped files saved to `output/`

---

## Prerequisites

- Node.js 18+
- An OpenAI-compatible API key (OpenAI, Azure, or any proxy)

---

## Installation

```bash
git clone https://github.com/diazjhozua/jobriq.git
cd jobriq
npm install
npm run build
npm install -g .
```

---

## Quick Start

```bash
# 1. Set your API key
cp .env.template .env
# Edit .env and fill in OPENAI_API_KEY (and optionally OPENAI_BASE_URL)

# 2. Create your resume template
jobriq init
# → creates resumes/my-resume.txt

# 3. Fill in resumes/my-resume.txt with your details

# 4. Build
jobriq build

# 5. Find your files in output/
```

---

## Commands

### `jobriq init`
Creates a blank `resumes/my-resume.txt` template ready to fill in.

### `jobriq build [file] [options]`

| Option | Description |
|---|---|
| `--job <file>` | Path to a job description `.txt` file for ATS keyword matching |
| `--design <name>` | Resume design to use (default: `classic`) |
| `--model <model>` | Override the OpenAI model (e.g. `gpt-4o-mini`) |

```bash
jobriq build
jobriq build resumes/my-resume.txt --job resumes/job.txt
jobriq build --design harvard
jobriq build --design modern --job resumes/job.txt
```

### `jobriq themes`
Lists all available built-in and custom designs.

---

## Designs

| Name | Font | Style |
|---|---|---|
| `classic` | Calibri | Neutral grays, centered header |
| `modern` | Calibri | Navy accent, left-aligned header |
| `minimal` | Arial | No color, maximum whitespace |
| `executive` | Georgia | Dark navy, left-aligned |
| `harvard` | Times New Roman | All black, bold underlined headers (Harvard OCS style) |

### Custom Themes

Create `themes/<name>.json` in your project directory. All fields are optional — unspecified fields fall back to `classic` defaults.

```json
{
  "font": "Georgia",
  "colors": {
    "text": "1A1A1A",
    "accent": "8B0000",
    "muted": "666666",
    "rule": "CCCCCC"
  },
  "sizes": {
    "name": 36,
    "heading": 26,
    "body": 22
  },
  "layout": {
    "headerAlignment": "left",
    "sectionOrder": ["summary", "experience", "education", "skills", "projects"],
    "sectionDivider": "rule",
    "headingUppercase": false
  }
}
```

```bash
jobriq build --design mytheme
```

---

## Template Format

`resumes/my-resume.txt` uses plain-text section headers. Lines starting with `#` are comments read by AI but not exported.

```
[PERSONAL]
Name: Alex Rivera
Email: alex@example.com

[EXPERIENCE]
Company: Acme Corp
Title: Software Engineer
Start: Jan 2022
End: Present
- worked on the chat feature
- built tools for the QA team

[JOB DESCRIPTION]
# Paste job description here for ATS matching
# Or use: jobriq build --job job.txt

[AI SUGGESTIONS]
# Auto-updated after each build run
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your API key |
| `OPENAI_BASE_URL` | No | Custom base URL (e.g. for proxies — include `/v1` suffix) |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o`) |

---

## Built With

- [TypeScript](https://www.typescriptlang.org/) + [Node.js](https://nodejs.org/)
- [Commander.js](https://github.com/tj/commander.js/) — CLI parsing
- [OpenAI SDK](https://github.com/openai/openai-node) — AI calls
- [docx](https://docx.js.org/) — Word document generation
- [Chalk](https://github.com/chalk/chalk) + [Ora](https://github.com/sindresorhus/ora) + [Boxen](https://github.com/sindresorhus/boxen) — terminal UI

---

## Author

**Jhozua Diaz** — [@diazjhozua](https://github.com/diazjhozua)

## License

MIT
