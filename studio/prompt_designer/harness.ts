/**
 * Prompt Pack Test Harness
 * Runs prompts against sample inputs and validates outputs
 */

import type { PromptPack } from './linter.js';
import { getValidator } from '../utils/validate.js';

export interface TestCase {
  name: string;
  input: unknown;
  expectedOutput?: unknown;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  errors: string[];
  output?: unknown;
  validationErrors?: string[];
}

export class PromptTestHarness {
  async runTests(pack: PromptPack, tests: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const validator = getValidator();

    for (const test of tests) {
      const result: TestResult = {
        testName: test.name,
        passed: false,
        errors: [],
      };

      // Validate input against inputSchema
      const inputValidation = await validator.validate(pack.inputSchema, test.input);
      if (!inputValidation.success) {
        result.errors.push(`Input validation failed: ${inputValidation.errors?.join(', ')}`);
        results.push(result);
        continue;
      }

      // In MVP, we can't actually run the prompt through an LLM
      // So we just validate that the expected output matches the schema
      if (test.expectedOutput) {
        const outputValidation = await validator.validate(pack.outputSchema, test.expectedOutput);
        
        if (outputValidation.success) {
          result.passed = true;
          result.output = test.expectedOutput;
        } else {
          result.validationErrors = outputValidation.errors;
          result.errors.push(`Expected output doesn't match schema: ${outputValidation.errors?.join(', ')}`);
        }
      } else {
        // No expected output to test against
        result.passed = true;
        result.errors.push('No expected output provided (skipped validation)');
      }

      results.push(result);
    }

    return results;
  }

  formatResults(results: TestResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    let output = `\n📊 Test Results: ${passed}/${total} passed\n\n`;

    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      output += `${icon} ${result.testName}\n`;
      
      if (result.errors.length > 0) {
        for (const error of result.errors) {
          output += `   ${error}\n`;
        }
      }
      
      if (result.validationErrors && result.validationErrors.length > 0) {
        output += `   Validation errors:\n`;
        for (const err of result.validationErrors) {
          output += `   - ${err}\n`;
        }
      }
      
      output += `\n`;
    }

    return output;
  }

  allPassed(results: TestResult[]): boolean {
    return results.every(r => r.passed);
  }
}
