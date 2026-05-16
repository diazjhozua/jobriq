#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { buildCommand } from './commands/build.js'

const program = new Command()

program
  .name('jobriq')
  .description('AI-powered resume builder — fill a template, let AI do the rest')
  .version('0.1.0')
  .addHelpText(
    'after',
    `
Quick start:
  1. Copy .env.template to .env and fill in your OpenAI API key
  2. jobriq init                 Create resumes/my-resume.txt
  3. Fill in resumes/my-resume.txt (any text editor)
  4. jobriq build                Enhance with AI, export .md + .docx

Tailoring to a job:
  jobriq build --job google-jd.txt
`
  )

program
  .command('init')
  .description('Create a blank resume-template.txt in the current directory')
  .action(initCommand)

program
  .command('build')
  .description('Enhance your resume with AI and export to Markdown + Word (.docx)')
  .argument('[file]', 'Template file to build from', 'resumes/my-resume.txt')
  .option('--job <file>', 'Job description .txt file for ATS keyword matching')
  .option('--model <model>', 'OpenAI model to use (overrides OPENAI_MODEL in .env)')
  .addHelpText(
    'after',
    `
Examples:
  jobriq build
  jobriq build resumes/my-resume.txt
  jobriq build resumes/my-resume.txt --job google-swe.txt
  jobriq build --model gpt-4o-mini
`
  )
  .action(buildCommand)

program.parse()
