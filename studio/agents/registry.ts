/**
 * Agent registry and pipeline configuration
 */

import type { Agent } from './types.js';
import type { GateCheckFn } from '../utils/cross_checks.js';
import { getValidator } from '../utils/validate.js';

import { RequirementsStructurerAgent } from './requirements_structurer.js';
import { DomainModelAgent } from './domain_model.js';
import { SystemArchitectAgent } from './system_architect.js';
import { APIContractAgent } from './api_contract.js';
import { PromptPackDesignerAgent } from './prompt_pack_designer.js';
import { ScaffoldBuilderAgent } from './scaffold_builder.js';
import { ReviewerVerifierAgent } from './reviewer_verifier.js';

import {
  apiUseCaseCoverageCheck,
  componentDomainAlignmentCheck,
  adrCompletenessCheck,
  promptCoverageCheck,
  scaffoldIntegrityCheck,
} from '../utils/cross_checks.js';

export interface PipelineStage {
  agentId: string;
  dependsOn: string[];
  gateChecks?: GateCheckFn[];
}

/**
 * Pipeline definition with dependencies
 */
export const AGENT_PIPELINE: PipelineStage[] = [
  {
    agentId: 'requirements-structurer',
    dependsOn: [],
  },
  {
    agentId: 'domain-model',
    dependsOn: ['requirements-structurer'],
  },
  {
    agentId: 'system-architect',
    dependsOn: ['requirements-structurer', 'domain-model'],
    gateChecks: [componentDomainAlignmentCheck, adrCompletenessCheck],
  },
  {
    agentId: 'api-contract',
    dependsOn: ['requirements-structurer', 'system-architect', 'domain-model'],
    gateChecks: [apiUseCaseCoverageCheck],
  },
  {
    agentId: 'prompt-pack-designer',
    dependsOn: ['requirements-structurer'],
    gateChecks: [promptCoverageCheck],
  },
  {
    agentId: 'scaffold-builder',
    dependsOn: ['requirements-structurer', 'domain-model', 'api-contract', 'system-architect'],
    gateChecks: [scaffoldIntegrityCheck],
  },
  {
    agentId: 'reviewer-verifier',
    dependsOn: ['scaffold-builder', 'prompt-pack-designer'],
  },
];

/**
 * Create and return all agents
 */
export function createAgents(): Map<string, Agent> {
  const validator = getValidator();
  const agents = new Map<string, Agent>();

  agents.set('requirements-structurer', new RequirementsStructurerAgent(validator));
  agents.set('domain-model', new DomainModelAgent(validator));
  agents.set('system-architect', new SystemArchitectAgent(validator));
  agents.set('api-contract', new APIContractAgent(validator));
  agents.set('prompt-pack-designer', new PromptPackDesignerAgent(validator));
  agents.set('scaffold-builder', new ScaffoldBuilderAgent(validator));
  agents.set('reviewer-verifier', new ReviewerVerifierAgent(validator));

  return agents;
}
