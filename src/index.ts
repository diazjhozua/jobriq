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

program
  .command('config')
  .description('Set your OpenAI API key')
  .action(configCommand)

program
  .command('init')
  .description('Generate a blank resume-template.txt in the current directory')
  .action(initCommand)

program
  .command('build [file]')
  .description('Enhance your resume with AI and export to Markdown + Word')
  .option('--job <file>', 'Path to a .txt file with the target job description')
  .action(buildCommand)

program.parse()
