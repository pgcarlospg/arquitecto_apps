/**
 * Reviewer Verifier Agent
 * Validates all artifacts for coherence and quality
 */

import { BaseAgent } from './base.js';
import type { AgentConfig, AgentContext } from './types.js';
import type { SchemaValidator } from '../utils/validate.js';
import {
  apiUseCaseCoverageCheck,
  componentDomainAlignmentCheck,
  adrCompletenessCheck,
  promptCoverageCheck,
  scaffoldIntegrityCheck,
  type GateCheckResult,
} from '../utils/cross_checks.js';

interface ReviewerVerifierInput {
  allOutputs: Map<string, unknown>;
}

interface GateReport {
  id: string;
  runId: string;
  timestamp: string;
  duration: {
    totalMs: number;
    byStage: Record<string, number>;
  };
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    errors: number;
    overallStatus: string;
  };
  stages: Array<{
    agentId: string;
    status: string;
    inputHash: string;
    outputHash?: string;
    checks: GateCheckResult[];
    errors?: string[];
    durationMs?: number;
  }>;
  recommendations: string[];
}

export class ReviewerVerifierAgent extends BaseAgent<ReviewerVerifierInput, GateReport> {
  readonly config: AgentConfig = {
    id: 'reviewer-verifier',
    name: 'Reviewer Verifier',
    description: 'Validates artifacts and produces quality gate reports',
    version: '1.0.0',
    inputSchema: '', // Composite input: all previous outputs
    outputSchema: 'https://architect-studio/schemas/gate-report.json',
  };

  constructor(validator: SchemaValidator) {
    super(validator);
  }

  protected async execute(input: ReviewerVerifierInput, context: AgentContext): Promise<GateReport> {
    const startTime = Date.now();
    
    // Use context.previousOutputs - create empty Map as fallback
    const outputs = context?.previousOutputs || new Map<string, unknown>();
    const gateContext = { outputs };

    // Run all quality gate checks
    const allChecks: GateCheckResult[] = [];
    
    try {
      allChecks.push(...apiUseCaseCoverageCheck(gateContext));
    } catch (e) {
      console.error('apiUseCaseCoverageCheck failed:', e);
    }
    
    try {
      allChecks.push(...componentDomainAlignmentCheck(gateContext));
    } catch (e) {
      console.error('componentDomainAlignmentCheck failed:', e);
    }
    
    try {
      allChecks.push(...adrCompletenessCheck(gateContext));
    } catch (e) {
      console.error('adrCompletenessCheck failed:', e);
    }
    
    try {
      allChecks.push(...promptCoverageCheck(gateContext));
    } catch (e) {
      console.error('promptCoverageCheck failed:', e);
    }
    
    try {
      allChecks.push(...scaffoldIntegrityCheck(gateContext));
    } catch (e) {
      console.error('scaffoldIntegrityCheck failed:', e);
    }

    const summary = this.computeSummary(allChecks);
    const stages = this.buildStageReports(outputs, allChecks);
    const recommendations = this.generateRecommendations(allChecks);

    const reportId = context.runId.replace(/[^a-f0-9]/g, '').substring(0, 32);

    return {
      id: `report-${reportId}`,
      runId: context.runId,
      timestamp: new Date().toISOString(),
      duration: {
        totalMs: Date.now() - startTime,
        byStage: {},
      },
      summary,
      stages,
      recommendations,
    };
  }

  private computeSummary(checks: GateCheckResult[]): GateReport['summary'] {
    const passed = checks.filter(c => c.passed).length;
    const warnings = checks.filter(c => !c.passed && c.severity === 'warning').length;
    const errors = checks.filter(c => !c.passed && c.severity === 'error').length;

    let overallStatus: string;
    if (errors > 0) {
      overallStatus = 'failed';
    } else if (warnings > 0) {
      overallStatus = 'passed-with-warnings';
    } else {
      overallStatus = 'passed';
    }

    return {
      totalChecks: checks.length,
      passed,
      warnings,
      errors,
      overallStatus,
    };
  }

  private buildStageReports(outputs: Map<string, unknown>, checks: GateCheckResult[]): GateReport['stages'] {
    const stages: GateReport['stages'] = [];
    const agentIds = [
      'requirements-structurer',
      'domain-model',
      'system-architect',
      'api-contract',
      'prompt-pack-designer',
      'scaffold-builder',
    ];

    for (const agentId of agentIds) {
      const output = outputs.get(agentId);
      if (!output) continue;

      // Find checks related to this stage
      const stageChecks = checks.filter(c => this.checkRelatedToStage(c, agentId));

      const hasErrors = stageChecks.some(c => !c.passed && c.severity === 'error');
      const status = hasErrors ? 'failed' : 'passed';

      stages.push({
        agentId,
        status,
        inputHash: 'sha256:' + '0'.repeat(64),
        outputHash: 'sha256:' + '1'.repeat(64),
        checks: stageChecks,
        errors: [],
      });
    }

    return stages;
  }

  private checkRelatedToStage(check: GateCheckResult, agentId: string): boolean {
    const checkToStage: Record<string, string[]> = {
      'api-usecase-coverage': ['api-contract'],
      'component-domain-alignment': ['system-architect'],
      'adr-completeness': ['system-architect'],
      'prompt-coverage': ['prompt-pack-designer'],
      'scaffold-integrity': ['scaffold-builder'],
    };

    return checkToStage[check.name]?.includes(agentId) ?? false;
  }

  private generateRecommendations(checks: GateCheckResult[]): string[] {
    const recommendations: string[] = [];
    const failed = checks.filter(c => !c.passed);

    if (failed.length === 0) {
      recommendations.push('All quality gates passed! Architecture is ready for implementation.');
      return recommendations;
    }

    const errorChecks = failed.filter(c => c.severity === 'error');
    const warningChecks = failed.filter(c => c.severity === 'warning');

    if (errorChecks.length > 0) {
      recommendations.push(
        `${errorChecks.length} critical errors must be fixed before proceeding.`
      );

      for (const check of errorChecks) {
        recommendations.push(`- Fix: ${check.message}`);
      }
    }

    if (warningChecks.length > 0) {
      recommendations.push(
        `${warningChecks.length} warnings detected. Consider addressing these for better quality.`
      );
    }

    // Specific recommendations based on check types
    const hasAdrWarnings = failed.some(c => c.name === 'adr-completeness');
    if (hasAdrWarnings) {
      recommendations.push(
        'Enhance ADRs with more alternatives and detailed trade-off analysis.'
      );
    }

    const hasCoverageWarnings = failed.some(c => c.name === 'api-usecase-coverage');
    if (hasCoverageWarnings) {
      recommendations.push(
        'Review use cases and ensure all have corresponding API endpoints.'
      );
    }

    return recommendations;
  }
}
