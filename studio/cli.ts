#!/usr/bin/env node

/**
 * Architect Studio CLI
 * Command-line interface for the Prompt & App Architect Studio
 */

import { Command } from 'commander';
import { StudioManager } from './manager.js';
import { PromptLinter } from './prompt_designer/linter.js';
import { readYamlFile, listFilesRecursive } from './utils/io.js';
import { join } from 'node:path';

const program = new Command();

program
  .name('architect')
  .description('Prompt & App Architect Studio - Transform specs into architecture')
  .version('0.1.0');

/**
 * Run command - Execute the full pipeline
 */
program
  .command('run')
  .description('Run the architect studio pipeline')
  .option('-s, --spec <path>', 'Path to functional specification markdown file', 'spec/functional.md')
  .option('-o, --output <dir>', 'Output directory for generated artifacts', 'output')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    console.log('🏗️  Architect Studio v0.1.0\n');

    const manager = new StudioManager();
    
    const result = await manager.run({
      specPath: options.spec,
      outputDir: options.output,
      verbose: options.verbose,
    });

    if (result.success) {
      console.log(`\n✅ Success! Run ID: ${result.runId}`);
      console.log(`\n📁 Generated artifacts:`);
      if (result.outputs) {
        console.log(`   - Design Brief: ${result.outputs.designBrief}`);
        console.log(`   - Architecture: ${result.outputs.architecture}`);
        console.log(`   - OpenAPI Spec: ${result.outputs.openapi}`);
        console.log(`   - Prompt Packs: ${result.outputs.promptPacks}`);
        console.log(`   - Scaffold: ${result.outputs.scaffold}`);
        console.log(`   - Quality Report: ${result.outputs.report}`);
      }
      console.log(`\n💡 Next steps:`);
      console.log(`   cd ${options.output}/scaffold`);
      console.log(`   npm install`);
      console.log(`   npm run dev`);
      process.exit(0);
    } else {
      console.error(`\n❌ Failed: ${result.message}`);
      if (result.errors && result.errors.length > 0) {
        console.error(`\nErrors:`);
        for (const error of result.errors) {
          console.error(`   - ${error}`);
        }
      }
      process.exit(1);
    }
  });

/**
 * Lint command - Validate prompt packs
 */
program
  .command('lint')
  .description('Lint prompt pack files')
  .option('-p, --prompts <dir>', 'Directory containing prompt packs', 'studio/prompts')
  .action(async (options) => {
    console.log('🔍 Linting prompt packs...\n');

    try {
      const promptFiles = await listFilesRecursive(options.prompts);
      const yamlFiles = promptFiles.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

      if (yamlFiles.length === 0) {
        console.log('⚠️  No prompt pack files found');
        process.exit(0);
      }

      const linter = new PromptLinter();
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const file of yamlFiles) {
        const pack = await readYamlFile(file);
        const results = linter.lint(pack);

        if (results.length > 0) {
          console.log(`\n📄 ${file}`);
          console.log(linter.formatResults(results));

          totalErrors += results.filter(r => r.severity === 'error').length;
          totalWarnings += results.filter(r => r.severity === 'warning').length;
        }
      }

      console.log(`\n📊 Summary:`);
      console.log(`   Files checked: ${yamlFiles.length}`);
      console.log(`   Errors: ${totalErrors}`);
      console.log(`   Warnings: ${totalWarnings}`);

      if (totalErrors > 0) {
        process.exit(1);
      } else {
        console.log('\n✅ All checks passed!');
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Linting failed:', error);
      process.exit(1);
    }
  });

/**
 * Test command - Run prompt pack tests (placeholder in MVP)
 */
program
  .command('test')
  .description('Run prompt pack tests')
  .option('-p, --prompt <file>', 'Specific prompt pack to test')
  .option('-f, --fixtures <dir>', 'Directory containing test fixtures', 'tests/fixtures')
  .action(async (options) => {
    console.log('🧪 Running tests...\n');
    console.log('⚠️  Test execution not yet implemented in MVP');
    console.log('   Tests will validate:');
    console.log('   - Input/output schema compliance');
    console.log('   - Example validation');
    console.log('   - Prompt constraints');
    console.log('\n💡 Run `npm run studio:lint` to validate prompt structure');
    process.exit(0);
  });

/**
 * Validate command - Check a spec file
 */
program
  .command('validate')
  .description('Validate a functional specification file')
  .argument('<spec-file>', 'Path to specification file')
  .action(async (specFile) => {
    console.log(`🔍 Validating ${specFile}...\n`);

    try {
      const { readTextFile } = await import('./utils/io.js');
      const content = await readTextFile(specFile);
      
      // Basic validation
      const lines = content.split('\n');
      const hasHeading = lines.some(l => l.startsWith('# '));
      
      if (!hasHeading) {
        console.log('⚠️  Warning: No main heading found (should start with # )');
      }

      const wordCount = content.split(/\s+/).length;
      console.log(`✅ File is readable`);
      console.log(`   Lines: ${lines.length}`);
      console.log(`   Words: ${wordCount}`);
      console.log(`   Characters: ${content.length}`);

      if (wordCount < 50) {
        console.log('\n⚠️  Warning: Spec seems very short. Consider adding more detail.');
      }

      console.log('\n✅ Validation complete!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

// Parse CLI arguments
program.parse();
