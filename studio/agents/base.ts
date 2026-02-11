/**
 * Base agent implementation with schema validation
 */

import type { Agent, AgentConfig, AgentContext, AgentResult } from './types.js';
import type { SchemaValidator } from '../utils/validate.js';
import { computeHash } from '../utils/hash.js';

export abstract class BaseAgent<TInput = unknown, TOutput = unknown> 
  implements Agent<TInput, TOutput> {
  
  abstract readonly config: AgentConfig;

  constructor(protected validator: SchemaValidator) {}

  async run(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    const inputHash = computeHash(input);

    if (context.verbose) {
      console.log(`[${this.config.id}] Starting execution...`);
    }

    // Validate input (skip if schema is empty or not provided)
    if (this.config.inputSchema && this.config.inputSchema.trim() !== '') {
      const inputValidation = await this.validator.validate<TInput>(
        this.config.inputSchema,
        input
      );

      if (!inputValidation.success) {
        return {
          success: false,
          errors: [`Input validation failed: ${inputValidation.errors?.join(', ')}`],
          metadata: { durationMs: Date.now() - startTime, inputHash },
        };
      }
    }

    // Execute agent logic
    try {
      const output = await this.execute(input, context);

      // Validate output (skip if schema is empty or not provided)
      if (this.config.outputSchema && this.config.outputSchema.trim() !== '') {
        const outputValidation = await this.validator.validate<TOutput>(
          this.config.outputSchema,
          output
        );

        if (!outputValidation.success) {
          return {
            success: false,
            errors: [`Output validation failed: ${outputValidation.errors?.join(', ')}`],
            metadata: { durationMs: Date.now() - startTime, inputHash },
          };
        }
      }

      const outputHash = computeHash(output);

      if (context.verbose) {
        console.log(`[${this.config.id}] Completed in ${Date.now() - startTime}ms`);
      }

      return {
        success: true,
        output,
        metadata: {
          durationMs: Date.now() - startTime,
          inputHash,
          outputHash,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: { durationMs: Date.now() - startTime, inputHash },
      };
    }
  }

  /**
   * Implement agent-specific logic here
   */
  protected abstract execute(input: TInput, context: AgentContext): Promise<TOutput>;
}
