/**
 * System Architect Agent
 * Designs system component architecture with ADRs
 */

import { BaseAgent } from './base.js';
import type { AgentConfig, AgentContext } from './types.js';
import type { SchemaValidator } from '../utils/validate.js';

interface SystemArchitectInput {
  designBrief: any;
  domainModel: any;
}

interface SystemArchitectOutput {
id: string;
  version: string;
  systemName: string;
  architectureStyle: string;
  components: Array<{
    id: string;
    name: string;
    layer: string;
    type: string;
    responsibilities?: string[];
    handlesEntities?: string[];
    dependencies?: string[];
  }>;
  connections: Array<{
    from: string;
    to: string;
    type: string;
    protocol?: string;
  }>;
  layers: Array<{
    name: string;
    order: number;
    description?: string;
  }>;
  adrs: Array<{
    id: string;
    title: string;
    status: string;
    date: string;
    context: string;
    decision: string;
    consequences: {
      positive?: string[];
      negative?: string[];
      neutral?: string[];
    };
    alternatives: Array<{
      name: string;
      description: string;
      rejected: boolean;
      reason?: string;
    }>;
  }>;
}

export class SystemArchitectAgent extends BaseAgent<SystemArchitectInput, SystemArchitectOutput> {
  readonly config: AgentConfig = {
    id: 'system-architect',
    name: 'System Architect',
    description: 'Designs system component architecture with layering and ADRs',
    version: '1.0.0',
    inputSchema: '', // Composite input: { designBrief, domainModel }
    outputSchema: 'https://architect-studio/schemas/component-map.json',
  };

  constructor(validator: SchemaValidator) {
    super(validator);
  }

  protected async execute(input: SystemArchitectInput, context: AgentContext): Promise<SystemArchitectOutput> {
    const { designBrief, domainModel } = input;
    
    const layers = this.defineLayers();
    const components = this.generateComponents(domainModel, designBrief);
    const connections = this.generateConnections(components);
    const adrs = this.generateADRs(context);

    const mapId = context.runId.replace(/[^a-f0-9]/g, '').substring(0, 32);

    return {
      id: `componentmap-${mapId}`,
      version: '1.0.0',
      systemName: designBrief.meta.name,
      architectureStyle: 'layered',
      components,
      connections,
      layers,
      adrs,
    };
  }

  private defineLayers(): SystemArchitectOutput['layers'] {
    return [
      { name: 'presentation', order: 0, description: 'HTTP routes and controllers' },
      { name: 'application', order: 1, description: 'Business logic and use case orchestration' },
      { name: 'domain', order: 2, description: 'Core domain entities and rules' },
      { name: 'infrastructure', order: 3, description: 'Database, external services, persistence' },
    ];
  }

  private generateComponents(domainModel: any, designBrief: any): SystemArchitectOutput['components'] {
    const components: SystemArchitectOutput['components'] = [];
    let compId = 1;

    const entities = domainModel.entities || [];

    // Generate components for each entity (CRUD pattern)
    for (const entity of entities) {
      const entityName = entity.name;

      // Presentation layer: Controller
      components.push({
        id: `COMP-${String(compId++).padStart(3, '0')}`,
        name: `${entityName}Controller`,
        layer: 'presentation',
        type: 'controller',
        responsibilities: [`Handle HTTP requests for ${entityName}`],
        handlesEntities: [entityName],
      });

      // Application layer: Service
      const serviceId = `COMP-${String(compId++).padStart(3, '0')}`;
      components.push({
        id: serviceId,
        name: `${entityName}Service`,
        layer: 'application',
        type: 'service',
        responsibilities: [`Business logic for ${entityName}`, `Orchestrate ${entityName} operations`],
        handlesEntities: [entityName],
      });

      // Infrastructure layer: Repository
      components.push({
        id: `COMP-${String(compId++).padStart(3, '0')}`,
        name: `${entityName}Repository`,
        layer: 'infrastructure',
        type: 'repository',
        responsibilities: [`Data persistence for ${entityName}`, `Database queries for ${entityName}`],
        handlesEntities: [entityName],
      });
    }

    // Add common infrastructure components
    components.push(
      {
        id: `COMP-${String(compId++).padStart(3, '0')}`,
        name: 'DatabaseClient',
        layer: 'infrastructure',
        type: 'gateway',
        responsibilities: ['Database connection management', 'Query execution'],
      },
      {
        id: `COMP-${String(compId++).padStart(3, '0')}`,
        name: 'AuthMiddleware',
        layer: 'presentation',
        type: 'middleware',
        responsibilities: ['Authentication', 'Authorization'],
      }
    );

    return components;
  }

  private generateConnections(components: SystemArchitectOutput['components']): SystemArchitectOutput['connections'] {
    const connections: SystemArchitectOutput['connections'] = [];

    // Connect controllers to services
    const controllers = components.filter(c => c.type === 'controller');
    const services = components.filter(c => c.type === 'service');
    const repositories = components.filter(c => c.type === 'repository');

    for (const controller of controllers) {
      const entityName = controller.name.replace('Controller', '');
      const service = services.find(s => s.name === `${entityName}Service`);
      
      if (service) {
        connections.push({
          from: controller.id,
          to: service.id,
          type: 'sync',
          protocol: 'http',
        });

        // Connect service to repository
        const repo = repositories.find(r => r.name === `${entityName}Repository`);
        if (repo) {
          connections.push({
            from: service.id,
            to: repo.id,
            type: 'sync',
            protocol: 'database',
          });
        }
      }
    }

    return connections;
  }

  private generateADRs(context: AgentContext): SystemArchitectOutput['adrs'] {
    return [
      {
        id: 'ADR-001',
        title: 'Use Layered Architecture',
        status: 'accepted',
        date: context.timestamp.toISOString(),
        context: 'Need to organize code in a maintainable, testable structure with clear separation of concerns',
        decision: 'Adopt a layered architecture with presentation, application, domain, and infrastructure layers',
        consequences: {
          positive: [
            'Clear separation of concerns',
            'Easier to test each layer independently',
            'Familiar pattern for most developers',
            'Good for modular monolith starting point',
          ],
          negative: [
            'Can lead to unnecessary complexity for simple CRUD',
            'May have performance overhead due to layer traversal',
          ],
        },
        alternatives: [
          {
            name: 'Hexagonal Architecture',
            description: 'Ports and adapters pattern with domain at the center',
            rejected: true,
            reason: 'More complex for MVP, better for systems with multiple adapters',
          },
          {
            name: 'Microservices',
            description: 'Split system into independent deployable services',
            rejected: true,
            reason: 'Too complex for initial version, adds operational overhead',
          },
        ],
      },
      {
        id: 'ADR-002',
        title: 'Use TypeScript with Node.js',
        status: 'accepted',
        date: context.timestamp.toISOString(),
        context: 'Need type safety and modern language features while maintaining ecosystem compatibility',
        decision: 'Use TypeScript with Node.js and Fastify framework',
        consequences: {
          positive: [
            'Type safety catches errors at compile time',
            'Better IDE support and autocomplete',
            'Large ecosystem of libraries',
            'Fastify provides excellent performance',
          ],
          negative: [
            'Build step required',
            'Learning curve for developers new to TypeScript',
          ],
        },
        alternatives: [
          {
            name: 'Python with FastAPI',
            description: 'Modern Python async framework with automatic OpenAPI',
            rejected: true,
            reason: 'Team more familiar with JavaScript ecosystem',
          },
          {
            name: 'Go',
            description: 'Compiled language with excellent performance',
            rejected: true,
            reason: 'Steeper learning curve, smaller web framework ecosystem',
          },
        ],
      },
      {
        id: 'ADR-003',
        title: 'Use PostgreSQL for Persistence',
        status: 'accepted',
        date: context.timestamp.toISOString(),
        context: 'Need reliable, ACID-compliant database with good JSON support',
        decision: 'Use PostgreSQL as primary database',
        consequences: {
          positive: [
            'ACID compliance ensures data integrity',
            'Excellent JSON/JSONB support for flexible schemas',
            'Strong community and tooling',
            'Good performance for most workloads',
          ],
          negative: [
            'Requires more setup than simpler databases',
            'Vertical scaling limits for very high scale',
          ],
        },
        alternatives: [
          {
            name: 'MongoDB',
            description: 'Document database with flexible schemas',
            rejected: true,
            reason: 'Less appropriate for relational data, eventual consistency model',
          },
          {
            name: 'MySQL',
            description: 'Popular relational database',
            rejected: true,
            reason: 'PostgreSQL has better JSON support and modern features',
          },
        ],
      },
    ];
  }
}
