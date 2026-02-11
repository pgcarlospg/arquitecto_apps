/**
 * API Contract Agent
 * Generates OpenAPI specification and JSON schemas
 */

import { BaseAgent } from './base.js';
import type { AgentConfig, AgentContext } from './types.js';
import type { SchemaValidator } from '../utils/validate.js';

interface APIContractInput {
  designBrief: any;
  componentMap: any;
  domainModel: any;
}

interface APIContractOutput {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export class APIContractAgent extends BaseAgent<APIContractInput, APIContractOutput> {
  readonly config: AgentConfig = {
    id: 'api-contract',
    name: 'API Contract Designer',
    description: 'Generates OpenAPI specifications and JSON schemas',
    version: '1.0.0',
    inputSchema: '', // Composite input: { designBrief, componentMap, domainModel }
    outputSchema: '', // Returns OpenAPI spec (not validated)
  };

  constructor(validator: SchemaValidator) {
    super(validator);
  }

  protected async execute(input: APIContractInput, context: AgentContext): Promise<APIContractOutput> {
    const { designBrief, componentMap, domainModel } = input;

    const schemas = this.generateSchemas(domainModel);
    const paths = this.generatePaths(domainModel);

    return {
      openapi: '3.0.3',
      info: {
        title: `${designBrief.meta.name} API`,
        version: '1.0.0',
        description: designBrief.meta.description || `API for ${designBrief.meta.name}`,
      },
      servers: [
        { url: '/api/v1', description: 'API v1' },
      ],
      paths,
      components: {
        schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };
  }

  private generateSchemas(domainModel: any): Record<string, any> {
    const schemas: Record<string, any> = {};

    // Generate schema for each entity
    for (const entity of domainModel.entities || []) {
      schemas[entity.name] = this.entityToSchema(entity);
      schemas[`${entity.name}Create`] = this.entityToCreateSchema(entity);
      schemas[`${entity.name}Update`] = this.entityToUpdateSchema(entity);
      schemas[`${entity.name}List`] = {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: `#/components/schemas/${entity.name}` },
          },
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
      };
    }

    // Common schemas
    schemas.ErrorResponse = {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        statusCode: { type: 'integer' },
      },
      required: ['error', 'message', 'statusCode'],
    };

    schemas.HealthCheck = {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string' },
      },
    };

    return schemas;
  }

  private entityToSchema(entity: any): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const attr of entity.attributes) {
      properties[attr.name] = this.attributeToJsonSchema(attr);
      if (attr.required) {
        required.push(attr.name);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  private entityToCreateSchema(entity: any): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const attr of entity.attributes) {
      // Skip auto-generated fields
      if (['id', 'createdAt', 'updatedAt'].includes(attr.name)) continue;

      properties[attr.name] = this.attributeToJsonSchema(attr);
      if (attr.required) {
        required.push(attr.name);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  private entityToUpdateSchema(entity: any): any {
    const properties: Record<string, any> = {};

    for (const attr of entity.attributes) {
      // Skip auto-generated and immutable fields
      if (['id', 'createdAt', 'updatedAt'].includes(attr.name)) continue;

      properties[attr.name] = this.attributeToJsonSchema(attr);
    }

    return {
      type: 'object',
      properties,
    };
  }

  private attributeToJsonSchema(attr: any): any {
    const typeMap: Record<string, any> = {
      string: { type: 'string' },
      number: { type: 'number' },
      boolean: { type: 'boolean' },
      date: { type: 'string', format: 'date' },
      datetime: { type: 'string', format: 'date-time' },
      uuid: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      url: { type: 'string', format: 'uri' },
      text: { type: 'string' },
      array: { type: 'array', items: { type: 'string' } },
      object: { type: 'object' },
    };

    return typeMap[attr.type] || { type: 'string' };
  }

  private generatePaths(domainModel: any): Record<string, any> {
    const paths: Record<string, any> = {};

    // Health check endpoint
    paths['/health'] = {
      get: {
        operationId: 'healthCheck',
        summary: 'Health check endpoint',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System health status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthCheck' },
              },
            },
          },
        },
      },
    };

    // Generate CRUD endpoints for each entity
    for (const entity of domainModel.entities || []) {
      const entityName = entity.name;
      const basePath = `/${entityName.toLowerCase()}s`;
      const itemPath = `${basePath}/{id}`;

      paths[basePath] = {
        get: {
          operationId: `list${entityName}s`,
          summary: `List all ${entityName}s`,
          tags: [entityName],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${entityName}List` },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        post: {
          operationId: `create${entityName}`,
          summary: `Create a new ${entityName}`,
          tags: [entityName],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${entityName}Create` },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created successfully',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${entityName}` },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      };

      paths[itemPath] = {
        get: {
          operationId: `get${entityName}`,
          summary: `Get ${entityName} by ID`,
          tags: [entityName],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${entityName}` },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        put: {
          operationId: `update${entityName}`,
          summary: `Update ${entityName}`,
          tags: [entityName],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${entityName}Update` },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${entityName}` },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        delete: {
          operationId: `delete${entityName}`,
          summary: `Delete ${entityName}`,
          tags: [entityName],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '204': {
              description: 'Deleted successfully',
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      };
    }

    return paths;
  }
}
