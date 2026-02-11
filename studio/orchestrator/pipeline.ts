/**
 * Pipeline Orchestrator
 * Runs agents in correct order with quality gates
 */

import { randomUUID } from 'crypto';
import type { Agent, AgentContext } from '../agents/types.js';
import type { PipelineStage } from '../agents/registry.js';
import type { GateCheckResult } from '../utils/cross_checks.js';
import { AuditLogger, type RunAudit } from './audit.js';
import { computeHash } from '../utils/hash.js';

export interface PipelineConfig {
  verbose?: boolean;
}

export interface PipelineResult {
  success: boolean;
  runId: string;
  outputs: Map<string, unknown>;
  failedAt?: string;
  errors?: string[];
  audit: RunAudit;
}

interface StageResult {
  agentId: string;
  success: boolean;
  output?: unknown;
  durationMs: number;
  inputHash: string;
  outputHash?: string;
  errors?: string[];
  gateResults?: GateCheckResult[];
}

export class PipelineOrchestrator {
  private agents: Map<string, Agent>;
  private stages: PipelineStage[];
  private auditLogger: AuditLogger;

  constructor(
    agents: Map<string, Agent>,
    stages: PipelineStage[],
    outputDir: string
  ) {
    this.agents = agents;
    this.stages = stages;
    this.auditLogger = new AuditLogger(outputDir);
  }

  async run(initialInput: unknown, config: PipelineConfig = {}): Promise<PipelineResult> {
    const runId = this.generateRunId();
    const startTime = new Date();
    const inputHash = computeHash(initialInput);

    await this.auditLogger.info(runId, 'Pipeline started', { inputHash });

    const context: AgentContext = {
      runId,
      timestamp: startTime,
      previousOutputs: new Map([['input', initialInput]]),
      verbose: config.verbose,
    };

    const stageResults: StageResult[] = [];
    const sortedStages = this.topologicalSort();

    for (const stage of sortedStages) {
      const agent = this.agents.get(stage.agentId);
      if (!agent) {
        const error = `Agent not found: ${stage.agentId}`;
        await this.auditLogger.error(runId, error);
        return this.buildFailureResult(runId, startTime, inputHash, stage.agentId, [error], stageResults);
      }

      await this.auditLogger.stage(runId, stage.agentId, 'Starting');

      // Resolve inputs from dependencies
      const input = this.resolveInputs(stage, context.previousOutputs);
      const stageStartTime = Date.now();

      // Run agent
      const result = await agent.run(input, context);
      const durationMs = Date.now() - stageStartTime;

      const stageResult: StageResult = {
        agentId: stage.agentId,
        success: result.success,
        output: result.output,
        durationMs,
        inputHash: result.metadata.inputHash,
        outputHash: result.metadata.outputHash,
        errors: result.errors,
      };

      if (!result.success) {
        await this.auditLogger.error(runId, `Agent ${stage.agentId} failed`, {
          errors: result.errors,
        });
        stageResults.push(stageResult);
        return this.buildFailureResult(runId, startTime, inputHash, stage.agentId, result.errors, stageResults);
      }

      // Store output for dependent stages
      context.previousOutputs.set(stage.agentId, result.output);

      // Run gate checks
      if (stage.gateChecks) {
        const gateResults = this.runGateChecks(stage.gateChecks, context.previousOutputs);
        stageResult.gateResults = gateResults;

        const failures = gateResults.filter(r => !r.passed && r.severity === 'error');
        if (failures.length > 0) {
          await this.auditLogger.error(runId, `Gate checks failed for ${stage.agentId}`, {
            failures: failures.map(f => f.message),
          });
          stageResults.push(stageResult);
          return this.buildFailureResult(
            runId,
            startTime,
            inputHash,
            `${stage.agentId}:gate`,
            failures.map(f => f.message),
            stageResults
          );
        }
      }

      await this.auditLogger.stage(runId, stage.agentId, `Completed in ${durationMs}ms`);
      stageResults.push(stageResult);
    }

    const endTime = new Date();
    const totalDurationMs = endTime.getTime() - startTime.getTime();

    await this.auditLogger.info(runId, 'Pipeline completed successfully', {
      totalDurationMs,
      stagesCompleted: stageResults.length,
    });

    // Build audit
    const audit = this.buildAudit(runId, startTime, endTime, inputHash, stageResults, 'success');
    await this.auditLogger.saveRunAudit(audit);

    return {
      success: true,
      runId,
      outputs: context.previousOutputs,
      audit,
    };
  }

  private resolveInputs(stage: PipelineStage, outputs: Map<string, unknown>): unknown {
    if (stage.dependsOn.length === 0) {
      // First stage gets the input
      return outputs.get('input');
    }

    if (stage.dependsOn.length === 1) {
      // Single dependency - pass output directly
      return outputs.get(stage.dependsOn[0]!);
    }

    // Multiple dependencies - create object with all inputs
    const input: Record<string, unknown> = {};
    for (const depId of stage.dependsOn) {
      const key = this.dependencyToKey(depId);
      input[key] = outputs.get(depId);
    }
    return input;
  }

  private dependencyToKey(agentId: string): string {
    const keyMap: Record<string, string> = {
      'requirements-structurer': 'designBrief',
      'domain-model': 'domainModel',
      'system-architect': 'componentMap',
      'api-contract': 'apiContract',
      'prompt-pack-designer': 'promptPacks',
      'scaffold-builder': 'buildPlan',
    };
    return keyMap[agentId] || agentId;
  }

  private runGateChecks(checks: any[], outputs: Map<string, unknown>): GateCheckResult[] {
    const results: GateCheckResult[] = [];
    const ctx = { outputs };

    for (const check of checks) {
      results.push(...check(ctx));
    }

    return results;
  }

  private topologicalSort(): PipelineStage[] {
    // Simple topological sort using Kahn's algorithm
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // Build graph
    for (const stage of this.stages) {
      inDegree.set(stage.agentId, stage.dependsOn.length);
      for (const dep of stage.dependsOn) {
        if (!graph.has(dep)) {
          graph.set(dep, []);
        }
        graph.get(dep)!.push(stage.agentId);
      }
    }

    // Find nodes with no dependencies
    const queue: PipelineStage[] = [];
    for (const stage of this.stages) {
      if (stage.dependsOn.length === 0) {
        queue.push(stage);
      }
    }

    const sorted: PipelineStage[] = [];

    while (queue.length > 0) {
      const stage = queue.shift()!;
      sorted.push(stage);

      const dependents = graph.get(stage.agentId) || [];
      for (const depId of dependents) {
        const deg = inDegree.get(depId)! - 1;
        inDegree.set(depId, deg);

        if (deg === 0) {
          const depStage = this.stages.find(s => s.agentId === depId);
          if (depStage) {
            queue.push(depStage);
          }
        }
      }
    }

    return sorted;
  }

  private generateRunId(): string {
    return randomUUID();
  }

  private buildFailureResult(
    runId: string,
    startTime: Date,
    inputHash: string,
    failedAt: string,
    errors: string[] | undefined,
    stageResults: StageResult[]
  ): PipelineResult {
    const endTime = new Date();
    const audit = this.buildAudit(runId, startTime, endTime, inputHash, stageResults, 'failed');

    return {
      success: false,
      runId,
      outputs: new Map(),
      failedAt,
      errors,
      audit,
    };
  }

  private buildAudit(
    runId: string,
    startTime: Date,
    endTime: Date,
    inputHash: string,
    stageResults: StageResult[],
    status: 'success' | 'failed'
  ): RunAudit {
    return {
      runId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      inputHash,
      spec: {
        path: '',
        projectName: '',
      },
      stages: stageResults.map(sr => ({
        agentId: sr.agentId,
        startTime: '',
        endTime: '',
        durationMs: sr.durationMs,
        inputHash: sr.inputHash,
        outputHash: sr.outputHash,
        success: sr.success,
        errors: sr.errors,
      })),
      outputs: {},
      overallStatus: status,
      totalDurationMs: endTime.getTime() - startTime.getTime(),
    };
  }
}
