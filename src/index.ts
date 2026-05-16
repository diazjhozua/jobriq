#!/usr/bin/env node
import { Command } from 'commander'
import { configCommand } from './commands/config.js'
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
  1. jobriq config               Save your OpenAI API key
  2. jobriq init                 Create resume-template.txt
  3. Fill in resume-template.txt (any text editor)
  4. jobriq build                Enhance with AI, export .md + .docx

Tailoring to a job:
  jobriq build --job google-jd.txt
`
  )

program
  .command('config')
  .description('Set your OpenAI API key (stored securely on your machine)')
  .action(configCommand)

program
  .command('init')
  .description('Create a blank resume-template.txt in the current directory')
  .action(initCommand)

program
  .command('build')
  .description('Enhance your resume with AI and export to Markdown + Word (.docx)')
  .argument('[file]', 'Template file to build from', 'resume-template.txt')
  .option('--job <file>', 'Job description .txt file for ATS keyword matching')
  .addHelpText(
    'after',
    `
Examples:
  jobriq build
  jobriq build my-resume.txt
  jobriq build resume-template.txt --job google-swe.txt
`
  )
  .action(buildCommand)

program.parse()
