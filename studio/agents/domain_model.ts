/**
 * Domain Model Agent
 * Extracts domain entities and relationships from design brief
 */

import { BaseAgent } from './base.js';
import type { AgentConfig, AgentContext } from './types.js';
import type { SchemaValidator } from '../utils/validate.js';

interface DesignBrief {
  id: string;
  useCases: Array<{
    id: string;
    actor: string;
    action: string;
    outcome: string;
  }>;
  goals: Array<{
    description: string;
  }>;
}

interface DomainModel {
  id: string;
  version: string;
  entities: Array<{
    name: string;
    description?: string;
    attributes: Array<{
      name: string;
      type: string;
      required: boolean;
      unique?: boolean;
      description?: string;
    }>;
    isAggregate?: boolean;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    description?: string;
  }>;
  valueObjects: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
  }>;
}

export class DomainModelAgent extends BaseAgent<DesignBrief, DomainModel> {
  readonly config: AgentConfig = {
    id: 'domain-model',
    name: 'Domain Model Designer',
    description: 'Extracts domain entities and relationships from requirements',
    version: '1.0.0',
    inputSchema: 'https://architect-studio/schemas/design-brief.json',
    outputSchema: 'https://architect-studio/schemas/domain-model.json',
  };

  constructor(validator: SchemaValidator) {
    super(validator);
  }

  protected async execute(input: DesignBrief, context: AgentContext): Promise<DomainModel> {
    // Extract entity names from use cases (nouns)
    const entityNames = this.extractEntityNames(input);
    const entities = this.buildEntities(entityNames);
    const relationships = this.inferRelationships(entities);

    // Generate a valid hex ID
    const domainId = context.runId.replace(/[^a-f0-9]/g, '').substring(0, 32);

    return {
      id: `domain-${domainId}`,
      version: '1.0.0',
      entities,
      relationships,
      valueObjects: [],
    };
  }

  private extractEntityNames(brief: DesignBrief): Set<string> {
    const names = new Set<string>();
    
    // Common domain entity patterns
    const commonEntities = ['User', 'Account', 'Profile', 'Settings', 'Task', 'Item', 'Project'];
    commonEntities.forEach(e => names.add(e));

    // Only extract from explicit entity-like words (conservative whitelist approach)
    const entityKeywords = ['Task', 'Item', 'Record', 'Document', 'Project', 'Order', 'Product',
                            'Category', 'Tag', 'Comment', 'Note', 'Notification', 'Message',
                            'Team', 'Group', 'Organization', 'Workspace', 'Board', 'List'];

    // Extract from use cases - only look for known entity keywords
    const allText = brief.useCases.map(uc => uc.action + ' ' + (uc.details || '')).join(' ') +
                    ' ' + brief.goals.map(g => g.description).join(' ');

    for (const keyword of entityKeywords) {
      const regex = new RegExp(`\\b${keyword}s?\\b`, 'i');
      if (regex.test(allText)) {
        names.add(keyword);
      }
    }

    return names;
  }

  private toPascalCase(str: string): string {
    // Remove non-alphanumeric characters and convert to PascalCase
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private buildEntities(names: Set<string>): DomainModel['entities'] {
    const entities: DomainModel['entities'] = [];

    for (const name of names) {
      entities.push({
        name,
        description: `${name} entity`,
        attributes: this.generateAttributesForEntity(name),
        isAggregate: name === 'User' || name === 'Account',
      });
    }

    return entities;
  }

  private generateAttributesForEntity(entityName: string): DomainModel['entities'][0]['attributes'] {
    const baseAttributes = [
      { name: 'id', type: 'uuid', required: true, unique: true },
      { name: 'createdAt', type: 'datetime', required: true },
      { name: 'updatedAt', type: 'datetime', required: true },
    ];

    // Entity-specific attributes
    const specificAttributes: Record<string, any[]> = {
      User: [
        { name: 'email', type: 'email', required: true, unique: true },
        { name: 'username', type: 'string', required: true, unique: true },
        { name: 'passwordHash', type: 'string', required: true },
      ],
      Account: [
        { name: 'name', type: 'string', required: true },
        { name: 'status', type: 'string', required: true },
      ],
      Profile: [
        { name: 'displayName', type: 'string', required: false },
        { name: 'bio', type: 'text', required: false },
      ],
      Task: [
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'status', type: 'string', required: true },
        { name: 'priority', type: 'string', required: false },
      ],
      Item: [
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'text', required: false },
      ],
    };

    const specific = specificAttributes[entityName] || [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text', required: false },
    ];

    return [...baseAttributes, ...specific];
  }

  private inferRelationships(entities: DomainModel['entities']): DomainModel['relationships'] {
    const relationships: DomainModel['relationships'] = [];

    // User relationships
    const hasUser = entities.some(e => e.name === 'User');
    if (hasUser) {
      for (const entity of entities) {
        if (entity.name !== 'User' && entity.name !== 'Profile') {
          relationships.push({
            from: 'User',
            to: entity.name,
            type: 'one-to-many',
            description: `User owns multiple ${entity.name}`,
          });
        }
      }

      // User-Profile special case
      if (entities.some(e => e.name === 'Profile')) {
        relationships.push({
          from: 'User',
          to: 'Profile',
          type: 'one-to-one',
          description: 'User has one Profile',
        });
      }
    }

    return relationships;
  }
}
