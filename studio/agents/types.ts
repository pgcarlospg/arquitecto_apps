/**
 * Agent system type definitions
 */

import type { SchemaValidator } from '../utils/validate.js';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  inputSchema: string;
  outputSchema: string;
}

export interface AgentContext {
  runId: string;
  timestamp: Date;
  previousOutputs: Map<string, unknown>;
  verbose?: boolean;
}

export interface AgentMetadata {
  durationMs: number;
  inputHash: string;
  outputHash?: string;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  output?: T;
  errors?: string[];
  metadata: AgentMetadata;
}

export interface Agent<TInput = unknown, TOutput = unknown> {
  readonly config: AgentConfig;
  run(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
}
