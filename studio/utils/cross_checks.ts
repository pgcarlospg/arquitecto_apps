/**
 * Cross-artifact validation checks that ensure consistency between outputs
 */

export interface GateCheckResult {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, any>;
}

export interface GateContext {
  outputs: Map<string, unknown>;
}

export type GateCheckFn = (ctx: GateContext) => GateCheckResult[];

/**
 * Check that all use cases have corresponding API endpoints
 */
export const apiUseCaseCoverageCheck: GateCheckFn = (ctx) => {
  const designBrief = ctx.outputs.get('requirements-structurer') as any;
  const apiContract = ctx.outputs.get('api-contract') as any;

  if (!designBrief?.useCases || !apiContract?.paths) {
    return [{
      name: 'api-usecase-coverage',
      passed: true,
      severity: 'info',
      message: 'Insufficient data for use case coverage check',
    }];
  }

  const useCaseActions = designBrief.useCases.map((uc: any) => 
    uc.action.toLowerCase().split(' ')[0]
  );

  const apiPaths = Object.keys(apiContract.paths);
  const uncovered = useCaseActions.filter((action: string) =>
    !apiPaths.some(path => path.toLowerCase().includes(action))
  );

  if (uncovered.length > 0) {
    return [{
      name: 'api-usecase-coverage',
      passed: false,
      severity: 'warning',
      message: `Some use cases lack API coverage: ${uncovered.join(', ')}`,
      details: { uncoveredUseCases: uncovered },
    }];
  }

  return [{
    name: 'api-usecase-coverage',
    passed: true,
    severity: 'info',
    message: `All ${useCaseActions.length} use cases have API coverage`,
  }];
};

/**
 * Check that component map references valid domain entities
 */
export const componentDomainAlignmentCheck: GateCheckFn = (ctx) => {
  const domainModel = ctx.outputs.get('domain-model') as any;
  const componentMap = ctx.outputs.get('system-architect') as any;

  if (!domainModel?.entities || !componentMap?.components) {
    return [{
      name: 'component-domain-alignment',
      passed: true,
      severity: 'info',
      message: 'Insufficient data for domain alignment check',
    }];
  }

  const entityNames = new Set(domainModel.entities.map((e: any) => e.name));
  const results: GateCheckResult[] = [];

  for (const component of componentMap.components) {
    if (component.handlesEntities && component.handlesEntities.length > 0) {
      const invalid = component.handlesEntities.filter((e: string) => !entityNames.has(e));
      if (invalid.length > 0) {
        results.push({
          name: 'component-domain-alignment',
          passed: false,
          severity: 'error',
          message: `Component "${component.name}" references unknown entities: ${invalid.join(', ')}`,
          details: { component: component.name, invalidEntities: invalid },
        });
      }
    }
  }

  if (results.length === 0) {
    return [{
      name: 'component-domain-alignment',
      passed: true,
      severity: 'info',
      message: 'All component entity references are valid',
    }];
  }

  return results;
};

/**
 * Check that architecture document has sufficient ADRs
 */
export const adrCompletenessCheck: GateCheckFn = (ctx) => {
  const architectData = ctx.outputs.get('system-architect') as any;

  if (!architectData?.adrs) {
    return [{
      name: 'adr-completeness',
      passed: false,
      severity: 'error',
      message: 'No ADRs found in architecture output',
    }];
  }

  const adrs = architectData.adrs;
  const minAdrs = 3;

  if (adrs.length < minAdrs) {
    return [{
      name: 'adr-completeness',
      passed: false,
      severity: 'warning',
      message: `Only ${adrs.length} ADRs found, expected at least ${minAdrs}`,
      details: { adrCount: adrs.length, minimum: minAdrs },
    }];
  }

  // Check that ADRs have alternatives
  const adrsWithoutAlternatives = adrs.filter((adr: any) => 
    !adr.alternatives || adr.alternatives.length === 0
  );

  if (adrsWithoutAlternatives.length > 0) {
    return [{
      name: 'adr-completeness',
      passed: false,
      severity: 'warning',
      message: `${adrsWithoutAlternatives.length} ADRs lack alternative options`,
      details: { adrsWithoutAlternatives: adrsWithoutAlternatives.map((a: any) => a.id) },
    }];
  }

  return [{
    name: 'adr-completeness',
    passed: true,
    severity: 'info',
    message: `${adrs.length} ADRs with alternatives documented`,
  }];
};

/**
 * Check that prompt packs exist for all agents
 */
export const promptCoverageCheck: GateCheckFn = (ctx) => {
  const promptPacks = ctx.outputs.get('prompt-pack-designer') as any;

  if (!promptPacks?.packs) {
    return [{
      name: 'prompt-coverage',
      passed: false,
      severity: 'error',
      message: 'No prompt packs generated',
    }];
  }

  const expectedAgents = [
    'requirements-structurer',
    'domain-model',
    'system-architect',
    'api-contract',
    'prompt-pack-designer',
    'scaffold-builder',
    'reviewer-verifier',
  ];

  const packAgentIds = new Set(promptPacks.packs.map((p: any) => p.agentId));
  const missing = expectedAgents.filter(id => !packAgentIds.has(id));

  if (missing.length > 0) {
    return [{
      name: 'prompt-coverage',
      passed: false,
      severity: 'warning',
      message: `Missing prompt packs for: ${missing.join(', ')}`,
      details: { missingAgents: missing },
    }];
  }

  return [{
    name: 'prompt-coverage',
    passed: true,
    severity: 'info',
    message: `All ${expectedAgents.length} agents have prompt packs`,
  }];
};

/**
 * Check that scaffold has valid package.json and scripts
 */
export const scaffoldIntegrityCheck: GateCheckFn = (ctx) => {
  const buildPlan = ctx.outputs.get('scaffold-builder') as any;

  if (!buildPlan?.files) {
    return [{
      name: 'scaffold-integrity',
      passed: false,
      severity: 'error',
      message: 'No scaffold files generated',
    }];
  }

  const files = buildPlan.files.map((f: any) => f.path);
  const requiredFiles = ['package.json', 'tsconfig.json', 'src/index.ts'];
  const missing = requiredFiles.filter(f => !files.includes(f));

  if (missing.length > 0) {
    return [{
      name: 'scaffold-integrity',
      passed: false,
      severity: 'error',
      message: `Missing required files: ${missing.join(', ')}`,
      details: { missingFiles: missing },
    }];
  }

  // Check for required scripts
  if (!buildPlan.scripts || !buildPlan.scripts.dev) {
    return [{
      name: 'scaffold-integrity',
      passed: false,
      severity: 'warning',
      message: 'package.json missing dev script',
    }];
  }

  return [{
    name: 'scaffold-integrity',
    passed: true,
    severity: 'info',
    message: `Scaffold includes ${files.length} files with required structure`,
  }];
};

/**
 * All quality gate checks
 */
export const ALL_GATE_CHECKS = {
  'api-usecase-coverage': apiUseCaseCoverageCheck,
  'component-domain-alignment': componentDomainAlignmentCheck,
  'adr-completeness': adrCompletenessCheck,
  'prompt-coverage': promptCoverageCheck,
  'scaffold-integrity': scaffoldIntegrityCheck,
};
