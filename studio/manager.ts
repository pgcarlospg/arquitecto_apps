/**
 * Studio Manager
 * Main coordinator for the Architect Studio pipeline
 */

import { readTextFile, writeJsonFile, writeYamlFile, writeTextFile, ensureDir } from './utils/io.js';
import { computeStringHash } from './utils/hash.js';
import { getValidator } from './utils/validate.js';
import { createAgents, AGENT_PIPELINE } from './agents/registry.js';
import { PipelineOrchestrator } from './orchestrator/pipeline.js';
import { join } from 'node:path';

export interface StudioConfig {
  specPath: string;
  outputDir: string;
  verbose?: boolean;
}

export interface StudioResult {
  success: boolean;
  runId: string;
  message: string;
  outputs?: {
    designBrief: string;
    architecture: string;
    openapi: string;
    promptPacks: string;
    scaffold: string;
    report: string;
  };
  errors?: string[];
}

export class StudioManager {
  async run(config: StudioConfig): Promise<StudioResult> {
    const { specPath, outputDir, verbose } = config;

    if (verbose) {
      console.log('🏗️  Architect Studio');
      console.log(`📄 Reading spec: ${specPath}`);
    }

    try {
      // Read and parse spec
      const specContent = await readTextFile(specPath);
      const spec = this.parseMarkdownSpec(specContent, specPath);
      const inputHash = computeStringHash(specContent);

      if (verbose) {
        console.log(`📋 Project: ${spec.projectName}`);
        console.log(`🔑 Input hash: ${inputHash.substring(0, 16)}...`);
      }

      // Ensure output directories exist
      await this.ensureOutputStructure(outputDir);

      // Create agents and pipeline
      const agents = createAgents();
      const orchestrator = new PipelineOrchestrator(agents, AGENT_PIPELINE, outputDir);

      // Run pipeline
      if (verbose) {
        console.log(`\n🚀 Starting pipeline with ${AGENT_PIPELINE.length} stages...\n`);
      }

      const result = await orchestrator.run(spec, { verbose });

      if (!result.success) {
        return {
          success: false,
          runId: result.runId,
          message: `Pipeline failed at ${result.failedAt}`,
          errors: result.errors,
        };
      }

      // Write outputs
      if (verbose) {
        console.log('\n📝 Writing outputs...');
      }

      const outputPaths = await this.writeOutputs(outputDir, result.outputs, result.runId);

      if (verbose) {
        console.log('✅ Pipeline completed successfully!');
        console.log(`\n📁 Outputs written to: ${outputDir}`);
      }

      return {
        success: true,
        runId: result.runId,
        message: 'Studio pipeline completed successfully',
        outputs: outputPaths,
      };
    } catch (error) {
      return {
        success: false,
        runId: 'error',
        message: 'Studio execution failed',
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private parseMarkdownSpec(content: string, path: string): any {
    // Simple markdown parser
    const lines = content.split('\n');
    const sections: Record<string, string> = {};
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.substring(2).trim().toLowerCase();
        currentContent = [];
      } else if (line.startsWith('## ')) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.substring(3).trim().toLowerCase();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    // Extract project name from first heading or filename
    const firstHeading = lines.find(l => l.startsWith('# '));
    const projectName = firstHeading
      ? firstHeading.substring(2).trim()
      : path.split('/').pop()?.replace('.md', '') || 'Unnamed Project';

    return {
      projectName,
      description: sections['overview'] || sections['description'] || sections['project overview'] || 'No description provided',
      requirements: [],
      sections: {
        overview: sections['overview'] || sections['project overview'] || '',
        goals: sections['goals'] || sections['objectives'] || '',
        useCases: sections['use cases'] || sections['user stories'] || '',
        constraints: sections['constraints'] || sections['limitations'] || '',
        nonFunctional: sections['non-functional requirements'] || '',
      },
    };
  }

  private async ensureOutputStructure(outputDir: string): Promise<void> {
    const dirs = [
      'design',
      'contracts',
      'contracts/schemas',
      'prompts',
      'scaffold',
      'eval',
      'audit',
    ];

    for (const dir of dirs) {
      await ensureDir(join(outputDir, dir));
    }
  }

  private async writeOutputs(
    outputDir: string,
    outputs: Map<string, unknown>,
    runId: string
  ): Promise<StudioResult['outputs']> {
    const paths: StudioResult['outputs'] = {
      designBrief: '',
      architecture: '',
      openapi: '',
      promptPacks: '',
      scaffold: '',
      report: '',
    };

    // Write design brief
    const designBrief = outputs.get('requirements-structurer');
    if (designBrief) {
      const path = join(outputDir, 'design', 'design_brief.json');
      await writeJsonFile(path, designBrief);
      paths.designBrief = path;
    }

    // Write architecture (component map + ADRs as markdown)
    const componentMap = outputs.get('system-architect') as any;
    if (componentMap) {
      const path = join(outputDir, 'design', 'architecture.md');
      const markdown = this.componentMapToMarkdown(componentMap);
      await writeTextFile(path, markdown);
      paths.architecture = path;
    }

    // Write OpenAPI spec
    const apiContract = outputs.get('api-contract');
    if (apiContract) {
      const path = join(outputDir, 'contracts', 'openapi.yaml');
      await writeYamlFile(path, apiContract);
      paths.openapi = path;

      // Write entity schemas
      const contract = apiContract as any;
      if (contract.components?.schemas) {
        for (const [name, schema] of Object.entries(contract.components.schemas)) {
          const schemaPath = join(outputDir, 'contracts', 'schemas', `${name}.json`);
          await writeJsonFile(schemaPath, schema);
        }
      }
    }

    // Write prompt packs
    const promptPacks = outputs.get('prompt-pack-designer') as any;
    if (promptPacks?.packs) {
      for (const pack of promptPacks.packs) {
        const agentDir = join(outputDir, 'prompts', pack.agentId);
        await ensureDir(agentDir);
        const path = join(agentDir, `v${pack.version}.md`);
        const markdown = this.promptPackToMarkdown(pack);
        await writeTextFile(path, markdown);
      }
      paths.promptPacks = join(outputDir, 'prompts');
    }

    // Write scaffold plan (actual scaffold files created later)
    const buildPlan = outputs.get('scaffold-builder');
    if (buildPlan) {
      const path = join(outputDir, 'scaffold', 'build-plan.json');
      await writeJsonFile(path, buildPlan);
      await this.generateScaffoldFiles(buildPlan as any, join(outputDir, 'scaffold'));
      paths.scaffold = join(outputDir, 'scaffold');
    }

    // Write gate report
    const gateReport = outputs.get('reviewer-verifier');
    if (gateReport) {
      const path = join(outputDir, 'eval', 'report.md');
      const markdown = this.gateReportToMarkdown(gateReport as any);
      await writeTextFile(path, markdown);
      paths.report = path;
    }

    return paths;
  }

  private componentMapToMarkdown(componentMap: any): string {
    let md = `# ${componentMap.systemName} Architecture\n\n`;
    md += `**Architecture Style:** ${componentMap.architectureStyle}\n`;
    md += `**Version:** ${componentMap.version}\n\n`;

    md += `## Components\n\n`;
    for (const layer of componentMap.layers) {
      const layerComponents = componentMap.components.filter((c: any) => c.layer === layer.name);
      if (layerComponents.length > 0) {
        md += `### ${layer.name.charAt(0).toUpperCase() + layer.name.slice(1)} Layer\n\n`;
        for (const comp of layerComponents) {
          md += `#### ${comp.name}\n`;
          md += `- **Type:** ${comp.type}\n`;
          md += `- **ID:** ${comp.id}\n`;
          if (comp.responsibilities && comp.responsibilities.length > 0) {
            md += `- **Responsibilities:**\n`;
            for (const resp of comp.responsibilities) {
              md += `  - ${resp}\n`;
            }
          }
          if (comp.handlesEntities && comp.handlesEntities.length > 0) {
            md += `- **Handles Entities:** ${comp.handlesEntities.join(', ')}\n`;
          }
          md += `\n`;
        }
      }
    }

    md += `## Architecture Decision Records\n\n`;
    for (const adr of componentMap.adrs || []) {
      md += `### ${adr.id}: ${adr.title}\n\n`;
      md += `**Status:** ${adr.status}\n`;
      md += `**Date:** ${adr.date}\n\n`;
      md += `#### Context\n${adr.context}\n\n`;
      md += `#### Decision\n${adr.decision}\n\n`;
      md += `#### Consequences\n\n`;
      if (adr.consequences.positive && adr.consequences.positive.length > 0) {
        md += `**Positive:**\n`;
        for (const pos of adr.consequences.positive) {
          md += `- ${pos}\n`;
        }
        md += `\n`;
      }
      if (adr.consequences.negative && adr.consequences.negative.length > 0) {
        md += `**Negative:**\n`;
        for (const neg of adr.consequences.negative) {
          md += `- ${neg}\n`;
        }
        md += `\n`;
      }
      md += `#### Alternatives Considered\n\n`;
      for (const alt of adr.alternatives || []) {
        md += `**${alt.name}**\n`;
        md += `${alt.description}\n`;
        if (alt.reason) {
          md += `*Rejected because: ${alt.reason}*\n`;
        }
        md += `\n`;
      }
      md += `---\n\n`;
    }

    return md;
  }

  private promptPackToMarkdown(pack: any): string {
    let md = `# ${pack.meta.name}\n\n`;
    md += `**Agent ID:** ${pack.agentId}\n`;
    md += `**Version:** ${pack.version}\n`;
    md += `**Last Updated:** ${pack.meta.lastUpdated}\n\n`;
    md += `## Description\n\n${pack.meta.description}\n\n`;
    md += `## System Prompt\n\n\`\`\`\n${pack.systemPrompt}\n\`\`\`\n\n`;
    md += `## Input Schema\n\`${pack.inputSchema}\`\n\n`;
    md += `## Output Schema\n\`${pack.outputSchema}\`\n\n`;
    if (pack.constraints && pack.constraints.length > 0) {
      md += `## Constraints\n\n`;
      for (const constraint of pack.constraints) {
        md += `- ${constraint}\n`;
      }
      md += `\n`;
    }
    return md;
  }

  private gateReportToMarkdown(report: any): string {
    const emoji = report.summary.overallStatus === 'passed' ? '✅' : 
                  report.summary.overallStatus === 'passed-with-warnings' ? '⚠️' : '❌';
    
    let md = `# Quality Gate Report\n\n`;
    md += `${emoji} **Status:** ${report.summary.overallStatus}\n`;
    md += `**Run ID:** ${report.runId}\n`;
    md += `**Timestamp:** ${report.timestamp}\n\n`;
    md += `## Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Checks | ${report.summary.totalChecks} |\n`;
    md += `| Passed | ${report.summary.passed} |\n`;
    md += `| Warnings | ${report.summary.warnings} |\n`;
    md += `| Errors | ${report.summary.errors} |\n\n`;

    md += `## Stage Results\n\n`;
    for (const stage of report.stages) {
      const stageEmoji = stage.status === 'passed' ? '✅' : '❌';
      md += `### ${stageEmoji} ${stage.agentId}\n\n`;
      if (stage.checks && stage.checks.length > 0) {
        for (const check of stage.checks) {
          const checkEmoji = check.passed ? '✅' : check.severity === 'error' ? '❌' : '⚠️';
          md += `- ${checkEmoji} ${check.message}\n`;
        }
        md += `\n`;
      }
    }

    if (report.recommendations && report.recommendations.length > 0) {
      md += `## Recommendations\n\n`;
      for (const rec of report.recommendations) {
        md += `- ${rec}\n`;
      }
    }

    return md;
  }

  private async generateScaffoldFiles(buildPlan: any, scaffoldDir: string): Promise<void> {
    // Generate package.json
    const packageJson = {
      name: buildPlan.projectName,
      version: '0.1.0',
      type: 'module',
      scripts: buildPlan.scripts,
      dependencies: buildPlan.dependencies.runtime,
      devDependencies: buildPlan.dependencies.dev,
    };
    await writeJsonFile(join(scaffoldDir, 'package.json'), packageJson);

    // Generate tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        outDir: 'dist',
        rootDir: 'src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };
    await writeJsonFile(join(scaffoldDir, 'tsconfig.json'), tsconfig);

    // Generate basic files (placeholders for MVP)
    await writeTextFile(join(scaffoldDir, '.gitignore'), 'node_modules/\ndist/\n.env\n*.log\n');
    await writeTextFile(join(scaffoldDir, '.env.example'), 'NODE_ENV=development\nPORT=3000\nDATABASE_URL=postgresql://user:password@localhost:5432/dbname\n');
    await writeTextFile(join(scaffoldDir, 'README.md'), `# ${buildPlan.projectName}\n\nGenerated by Architect Studio.\n\n## Setup\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);
  }
}
