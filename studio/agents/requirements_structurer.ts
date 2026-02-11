/**
 * Requirements Structurer Agent
 * Transforms functional specs into structured design briefs
 */

import { BaseAgent } from './base.js';
import type { AgentConfig, AgentContext } from './types.js';
import type { SchemaValidator } from '../utils/validate.js';

interface FunctionalSpec {
  projectName: string;
  description: string;
  requirements?: string[];
  sections?: {
    overview?: string;
    goals?: string;
    useCases?: string;
    constraints?: string;
    nonFunctional?: string;
  };
}

interface DesignBrief {
  id: string;
  version: string;
  meta: {
    name: string;
    createdAt: string;
    sourceHash: string;
    description?: string;
  };
  goals: Array<{
    id: string;
    description: string;
    priority: 'must' | 'should' | 'could' | 'wont';
    category?: string;
  }>;
  useCases: Array<{
    id: string;
    actor: string;
    action: string;
    outcome: string;
    linkedGoals?: string[];
    preconditions?: string[];
  }>;
  constraints: Array<{
    id: string;
    type: string;
    description: string;
    impact?: string;
  }>;
  actors: Array<{
    id: string;
    name: string;
    type: string;
    responsibilities?: string[];
  }>;
}

export class RequirementsStructurerAgent extends BaseAgent<FunctionalSpec, DesignBrief> {
  readonly config: AgentConfig = {
    id: 'requirements-structurer',
    name: 'Requirements Structurer',
    description: 'Transforms functional specifications into structured design briefs',
    version: '1.0.0',
    inputSchema: 'https://architect-studio/schemas/functional-spec.json',
    outputSchema: 'https://architect-studio/schemas/design-brief.json',
  };

  constructor(validator: SchemaValidator) {
    super(validator);
  }

  protected async execute(input: FunctionalSpec, context: AgentContext): Promise<DesignBrief> {
    // Extract goals from requirements or sections
    const goals = this.extractGoals(input);
    const useCases = this.extractUseCases(input);
    const constraints = this.extractConstraints(input);
    const actors = this.extractActors(useCases);

    // Generate a simple hex ID from runId
    const briefId = context.runId.replace(/[^a-f0-9]/g, '').substring(0, 32);

    return {
      id: `brief-${briefId}`,
      version: '0.1.0',
      meta: {
        name: input.projectName,
        createdAt: context.timestamp.toISOString(),
        sourceHash: context.previousOutputs.get('inputHash') as string || 'sha256:' + '0'.repeat(64),
        description: input.description,
      },
      goals,
      useCases,
      constraints,
      actors,
    };
  }

  private extractGoals(spec: FunctionalSpec): DesignBrief['goals'] {
    const goals: DesignBrief['goals'] = [];
    let goalIndex = 1;

    // Parse from requirements array
    if (spec.requirements && spec.requirements.length > 0) {
      for (const req of spec.requirements) {
        goals.push({
          id: `G-${String(goalIndex).padStart(3, '0')}`,
          description: req,
          priority: goalIndex <= 3 ? 'must' : goalIndex <= 6 ? 'should' : 'could',
          category: 'functional',
        });
        goalIndex++;
      }
    }

    // Parse from goals section
    if (spec.sections?.goals) {
      const goalLines = spec.sections.goals
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));
      
      for (const line of goalLines) {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        if (cleaned.length > 5) {
          goals.push({
            id: `G-${String(goalIndex).padStart(3, '0')}`,
            description: cleaned,
            priority: 'must',
            category: 'functional',
          });
          goalIndex++;
        }
      }
    }

    // Ensure at least one goal
    if (goals.length === 0) {
      goals.push({
        id: 'G-001',
        description: `Implement ${spec.projectName}`,
        priority: 'must',
        category: 'functional',
      });
    }

    return goals;
  }

  private extractUseCases(spec: FunctionalSpec): DesignBrief['useCases'] {
    const useCases: DesignBrief['useCases'] = [];
    let ucIndex = 1;

    if (spec.sections?.useCases) {
      const ucLines = spec.sections.useCases
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));

      for (const line of ucLines) {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        if (cleaned.length > 10) {
          const parts = cleaned.split(' can ');
          const actor = parts[0]?.trim() || 'User';
          const actionPart = parts[1] || cleaned;
          
          useCases.push({
            id: `UC-${String(ucIndex).padStart(3, '0')}`,
            actor,
            action: actionPart,
            outcome: `Successfully ${actionPart.toLowerCase()}`,
          });
          ucIndex++;
        }
      }
    }

    // Default use cases if none found
    if (useCases.length === 0) {
      useCases.push(
        {
          id: 'UC-001',
          actor: 'User',
          action: 'access the system',
          outcome: 'Successfully authenticated and authorized',
        },
        {
          id: 'UC-002',
          actor: 'User',
          action: 'view main dashboard',
          outcome: 'Dashboard displays relevant information',
        }
      );
    }

    return useCases;
  }

  private extractConstraints(spec: FunctionalSpec): DesignBrief['constraints'] {
    const constraints: DesignBrief['constraints'] = [];
    let cIndex = 1;

    if (spec.sections?.constraints) {
      const constraintLines = spec.sections.constraints
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));

      for (const line of constraintLines) {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        if (cleaned.length > 5) {
          constraints.push({
            id: `C-${String(cIndex).padStart(3, '0')}`,
            type: 'technical',
            description: cleaned,
            impact: 'medium',
          });
          cIndex++;
        }
      }
    }

    return constraints;
  }

  private extractActors(useCases: DesignBrief['useCases']): DesignBrief['actors'] {
    const actorNames = new Set(useCases.map(uc => uc.actor));
    const actors: DesignBrief['actors'] = [];
    let aIndex = 1;

    for (const actorName of actorNames) {
      actors.push({
        id: `A-${String(aIndex).padStart(3, '0')}`,
        name: actorName,
        type: actorName.toLowerCase().includes('admin') ? 'admin' : 
              actorName.toLowerCase().includes('system') ? 'system' : 'user',
        responsibilities: useCases
          .filter(uc => uc.actor === actorName)
          .map(uc => uc.action),
      });
      aIndex++;
    }

    return actors;
  }
}
