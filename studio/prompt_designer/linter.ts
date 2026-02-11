/**
 * Prompt Pack Linter
 * Validates prompt packs against format rules
 */

export interface LintResult {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

export interface PromptPack {
  id: string;
  agentId: string;
  systemPrompt: string;
  variables?: Array<{ name: string; type: string; required?: boolean }>;
  inputSchema: string;
  outputSchema: string;
  constraints?: string[];
  refusalRules?: string[];
}

export class PromptLinter {
  private rules: LintRule[] = [
    new UndefinedVariablesRule(),
    new SchemaRefsValidRule(),
    new MaxPromptLengthRule(4000),
    new RequiredSectionsRule(),
  ];

  lint(pack: PromptPack): LintResult[] {
    const results: LintResult[] = [];

    for (const rule of this.rules) {
      results.push(...rule.check(pack));
    }

    // Sort by severity: errors first, then warnings, then info
    return results.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  hasErrors(results: LintResult[]): boolean {
    return results.some(r => r.severity === 'error');
  }

  formatResults(results: LintResult[]): string {
    if (results.length === 0) {
      return '✅ No issues found';
    }

    let output = '';
    for (const result of results) {
      const icon = result.severity === 'error' ? '❌' : 
                   result.severity === 'warning' ? '⚠️' : 'ℹ️';
      output += `${icon} [${result.rule}] ${result.message}\n`;
    }

    return output;
  }
}

interface LintRule {
  check(pack: PromptPack): LintResult[];
}

/**
 * Check that all variables used in systemPrompt are defined
 */
class UndefinedVariablesRule implements LintRule {
  check(pack: PromptPack): LintResult[] {
    const definedVars = new Set(
      (pack.variables || []).map(v => v.name)
    );

    const usedVars = this.extractVariables(pack.systemPrompt);
    const undefined = [...usedVars].filter(v => !definedVars.has(v));

    if (undefined.length > 0) {
      return [{
        rule: 'no-undefined-variables',
        severity: 'error',
        message: `Undefined variables: ${undefined.join(', ')}`,
      }];
    }

    return [];
  }

  private extractVariables(template: string): Set<string> {
    const matches = template.matchAll(/\{\{([^}]+)\}\}/g);
    const variables = new Set<string>();

    for (const match of matches) {
      const varExpr = match[1]?.trim();
      if (varExpr) {
        // Extract variable name (ignore helpers like #if, #each)
        const name = varExpr.split(/\s+/)[0]?.replace(/^[#/]/, '');
        if (name && !['if', 'each', 'unless'].includes(name)) {
          variables.add(name.split('.')[0]!);
        }
      }
    }

    return variables;
  }
}

/**
 * Check that schema references are valid URIs
 */
class SchemaRefsValidRule implements LintRule {
  check(pack: PromptPack): LintResult[] {
    const results: LintResult[] = [];
    const baseUrl = 'https://architect-studio/schemas/';

    if (!pack.inputSchema.startsWith(baseUrl)) {
      results.push({
        rule: 'schema-refs-valid',
        severity: 'error',
        message: `Invalid inputSchema URI: ${pack.inputSchema}`,
      });
    }

    if (!pack.outputSchema.startsWith(baseUrl)) {
      results.push({
        rule: 'schema-refs-valid',
        severity: 'error',
        message: `Invalid outputSchema URI: ${pack.outputSchema}`,
      });
    }

    return results;
  }
}

/**
 * Check prompt length
 */
class MaxPromptLengthRule implements LintRule {
  constructor(private maxLength: number) {}

  check(pack: PromptPack): LintResult[] {
    const length = pack.systemPrompt.length;

    if (length > this.maxLength) {
      return [{
        rule: 'max-prompt-length',
        severity: 'warning',
        message: `System prompt is ${length} characters (max ${this.maxLength})`,
      }];
    }

    // Info if approaching limit
    if (length > this.maxLength * 0.8) {
      return [{
        rule: 'max-prompt-length',
        severity: 'info',
        message: `System prompt is ${length} characters (80% of max)`,
      }];
    }

    return [];
  }
}

/**
 * Check for required sections in system prompt
 */
class RequiredSectionsRule implements LintRule {
  private requiredSections = [
    'objective',
    'input',
    'output',
    'constraints',
  ];

  check(pack: PromptPack): LintResult[] {
    const results: LintResult[] = [];
    const promptLower = pack.systemPrompt.toLowerCase();

    for (const section of this.requiredSections) {
      if (!promptLower.includes(section)) {
        results.push({
          rule: 'required-sections',
          severity: 'warning',
          message: `Missing recommended section: ${section.toUpperCase()}`,
        });
      }
    }

    return results;
  }
}
