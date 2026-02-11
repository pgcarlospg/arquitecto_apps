/**
 * Scaffold Builder Agent
 * Generates runnable code scaffold from architecture
 */

import { BaseAgent } from './base.js';
import type { AgentConfig, AgentContext } from './types.js';
import type { SchemaValidator } from '../utils/validate.js';

interface ScaffoldBuilderInput {
  designBrief: any;
  componentMap: any;
  domainModel: any;
  apiContract: any;
}

interface BuildPlan {
  id: string;
  version: string;
  projectName: string;
  stack: {
    type: string;
    framework: string;
    database: string;
    features: string[];
  };
  files: Array<{
    path: string;
    type: string;
    content?: string;
  }>;
  dependencies: {
    runtime: Record<string, string>;
    dev: Record<string, string>;
  };
  resources: Array<{
    name: string;
    type: string;
    routes?: any[];
  }>;
  scripts: Record<string, string>;
}

export class ScaffoldBuilderAgent extends BaseAgent<ScaffoldBuilderInput, BuildPlan> {
  readonly config: AgentConfig = {
    id: 'scaffold-builder',
    name: 'Scaffold Builder',
    description: 'Generates runnable code scaffold from architecture',
    version: '1.0.0',
    inputSchema: '', // Composite input: { designBrief, componentMap, domainModel, apiContract }
    outputSchema: 'https://architect-studio/schemas/build-plan.json',
  };

  constructor(validator: SchemaValidator) {
    super(validator);
  }

  protected async execute(input: ScaffoldBuilderInput, context: AgentContext): Promise<BuildPlan> {
    const { designBrief, componentMap, domainModel, apiContract } = input;

    const projectName = this.toKebabCase(designBrief.meta.name);
    const resources = this.extractResources(domainModel);

    const planId = context.runId.replace(/[^a-f0-9]/g, '').substring(0, 32);

    return {
      id: `buildplan-${planId}`,
      version: '1.0.0',
      projectName,
      stack: {
        type: 'nodejs',
        framework: 'fastify',
        database: 'postgres',
        features: ['docker', 'openapi', 'logging'],
      },
      files: this.generateFileList(projectName, resources),
      dependencies: this.generateDependencies(),
      resources,
      scripts: this.generateScripts(),
    };
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  private extractResources(domainModel: any): BuildPlan['resources'] {
    return (domainModel.entities || []).map((entity: any) => ({
      name: entity.name,
      type: 'entity',
      routes: [],
    }));
  }

  private generateFileList(projectName: string, resources: BuildPlan['resources']): BuildPlan['files'] {
    const files: BuildPlan['files'] = [
      // Root files
      { path: 'package.json', type: 'generated' },
      { path: 'tsconfig.json', type: 'generated' },
      { path: '.env.example', type: 'static' },
      { path: '.gitignore', type: 'static' },
      { path: 'README.md', type: 'static' },
      { path: 'Dockerfile', type: 'static' },
      { path: 'docker-compose.yml', type: 'static' },

      // Source structure
      { path: 'src/index.ts', type: 'static' },
      { path: 'src/app.ts', type: 'static' },
      { path: 'src/config/index.ts', type: 'static' },
      { path: 'src/config/database.ts', type: 'static' },
      
      // Plugins
      { path: 'src/plugins/cors.ts', type: 'static' },
      { path: 'src/plugins/swagger.ts', type: 'static' },
      
      // Middleware
      { path: 'src/middleware/auth.ts', type: 'static' },
      { path: 'src/middleware/error-handler.ts', type: 'static' },
      
      // Database
      { path: 'src/db/client.ts', type: 'static' },
      { path: 'src/db/schema.sql', type: 'static' },
    ];

    // Generate files for each resource
    for (const resource of resources) {
      const name = resource.name.toLowerCase();
      files.push(
        { path: `src/routes/${name}/index.ts`, type: 'generated' },
        { path: `src/routes/${name}/schema.ts`, type: 'generated' },
        { path: `src/routes/${name}/service.ts`, type: 'generated' },
        { path: `src/routes/${name}/repository.ts`, type: 'generated' },
      );
    }

    return files;
  }

  private generateDependencies(): BuildPlan['dependencies'] {
    return {
      runtime: {
        'fastify': '^4.26.0',
        '@fastify/cors': '^9.0.0',
        '@fastify/swagger': '^8.14.0',
        '@fastify/swagger-ui': '^3.0.0',
        'pg': '^8.11.0',
        'dotenv': '^16.4.0',
        'pino': '^8.19.0',
        'pino-pretty': '^10.3.0',
      },
      dev: {
        'typescript': '^5.3.0',
        '@types/node': '^20.11.0',
        '@types/pg': '^8.11.0',
        'tsx': '^4.7.0',
        'nodemon': '^3.0.0',
      },
    };
  }

  private generateScripts(): Record<string, string> {
    return {
      'dev': 'nodemon --exec tsx src/index.ts',
      'build': 'tsc',
      'start': 'node dist/index.js',
      'typecheck': 'tsc --noEmit',
    };
  }
}
