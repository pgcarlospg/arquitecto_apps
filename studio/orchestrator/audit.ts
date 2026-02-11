/**
 * Audit Trail Logger
 * Logs pipeline execution to JSONL file
 */

import { appendJsonLine } from '../utils/io.js';
import { join } from 'node:path';

export interface AuditLogEntry {
  timestamp: string;
  runId: string;
  level: 'info' | 'warn' | 'error';
  agentId?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface RunAudit {
  runId: string;
  startTime: string;
  endTime?: string;
  inputHash: string;
  spec: {
    path: string;
    projectName: string;
  };
  stages: Array<{
    agentId: string;
    startTime: string;
    endTime: string;
    durationMs: number;
    inputHash: string;
    outputHash?: string;
    success: boolean;
    errors?: string[];
  }>;
  outputs: {
    designBrief?: string;
    domainModel?: string;
    componentMap?: string;
    apiContract?: string;
    promptPacks?: string;
    buildPlan?: string;
    gateReport?: string;
  };
  overallStatus: 'success' | 'failed';
  totalDurationMs?: number;
}

export class AuditLogger {
  private logPath: string;
  private auditPath: string;

  constructor(private outputDir: string) {
    this.logPath = join(outputDir, 'audit', 'log.jsonl');
    this.auditPath = join(outputDir, 'audit', 'run.json');
  }

  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    await appendJsonLine(this.logPath, fullEntry);
  }

  async info(runId: string, message: string, data?: Record<string, unknown>): Promise<void> {
    await this.log({ runId, level: 'info', message, data });
  }

  async warn(runId: string, message: string, data?: Record<string, unknown>): Promise<void> {
    await this.log({ runId, level: 'warn', message, data });
  }

  async error(runId: string, message: string, data?: Record<string, unknown>): Promise<void> {
    await this.log({ runId, level: 'error', message, data });
  }

  async stage(runId: string, agentId: string, message: string): Promise<void> {
    await this.log({ runId, level: 'info', agentId, message });
  }

  async saveRunAudit(audit: RunAudit): Promise<void> {
    const { writeJsonFile } = await import('../utils/io.js');
    await writeJsonFile(this.auditPath, audit);
  }
}
