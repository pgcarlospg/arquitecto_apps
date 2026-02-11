# Prompt Pack Format Specification

## Overview

Prompt Packs are versioned templates that define how specialized agents should process inputs and generate outputs. Each pack includes:

- **System Prompt**: Core instructions for the agent
- **Variables**: Configurable parameters with types and defaults
- **Schema References**: Input and output JSON Schema URIs
- **Constraints**: Hard rules the agent must follow
- **Refusal Rules**: Conditions for refusing or requesting clarification
- **Examples**: Sample inputs and expected outputs

## File Format

Prompt Packs are stored as YAML files with the following structure:

```yaml
$schema: "https://architect-studio/schemas/prompt-pack.json"
id: "prompt-<agent-id>-v<version>"
agentId: "<agent-identifier>"
version: "<semver>"

meta:
  name: "Human-Readable Agent Name"
  description: "Brief description of agent purpose"
  author: "Author name or organization"
  lastUpdated: "<ISO 8601 timestamp>"

systemPrompt: |
  ... multi-line prompt text with {{variables}} ...

variables:
  - name: variableName
    type: string|number|boolean|array|object
    required: true|false
    default: <value>
    description: "What this variable controls"

inputSchema: "https://architect-studio/schemas/<schema-name>.json"
outputSchema: "https://architect-studio/schemas/<schema-name>.json"

examples:
  - name: "Example Name"
    input:
      <JSON matching inputSchema>
    expectedOutput:
      <JSON matching outputSchema>

constraints:
  - "Hard rule 1"
  - "Hard rule 2"

refusalRules:
  - "Refuse if condition X"
  - "Ask for clarification if condition Y"
```

## Variable Syntax

Variables in the `systemPrompt` use Handlebars-style double curly braces:

```
{{variableName}}           # Simple variable
{{#each items}}...{{/each}}  # Array iteration
{{#if condition}}...{{/if}}  # Conditional
```

All variables referenced in the prompt must be defined in the `variables` section.

## Required Sections

Every prompt pack MUST include:

1. **OBJECTIVE** - Clear statement of what the agent does
2. **INPUT** - Description or schema of expected input
3. **OUTPUT** - Description or schema of expected output
4. **CONSTRAINTS** - Non-negotiable rules
5. **REFUSAL RULES** - When to refuse processing

## Best Practices

### 1. Be Specific and Unambiguous

❌ Bad:
```
Process the data appropriately.
```

✅ Good:
```
Extract all entities from the DesignBrief that match the pattern ^[A-Z][a-zA-Z0-9]*$ 
and create a JSON array with name, attributes, and relationships.
```

### 2. Reference Schemas Explicitly

❌ Bad:
```
Output should be valid JSON.
```

✅ Good:
```
Output MUST be valid JSON matching https://architect-studio/schemas/domain-model.json.
All entities must have 'id', 'name', and 'attributes' fields.
```

### 3. Document Assumptions

❌ Bad:
```
If unclear, make reasonable assumptions.
```

✅ Good:
```
If entity boundaries are ambiguous:
1. Favor more granular entities over larger ones
2. Document assumption in output metadata
3. Never invent entities not derivable from input
```

### 4. Include Concrete Examples

Always provide at least one example showing:
- Realistic input
- Expected output structure
- Edge case handling

### 5. Version Prompts Semantically

- **Patch** (1.0.1): Typo fixes, clarifications
- **Minor** (1.1.0): New optional variables, additional examples
- **Major** (2.0.0): Breaking changes to input/output schemas

## Linting Rules

All prompt packs must pass these checks:

1. **no-undefined-variables**: All `{{variables}}` in systemPrompt must be defined
2. **schema-refs-valid**: All $ref URIs must resolve to valid schemas
3. **examples-validate**: All examples must pass their respective schemas
4. **max-prompt-length**: System prompt should not exceed 4000 characters
5. **required-sections**: OBJECTIVE, INPUT, OUTPUT, CONSTRAINTS must be present

## Testing Prompts

Use the test harness to validate prompts:

```bash
npm run studio:test -- --prompt prompts/agent-name/v1.0.0.yaml
```

This will:
1. Validate YAML structure
2. Check schema references
3. Run examples through the agent
4. Verify outputs match schemas
5. Report pass/fail with diffs

## Migration Guide

When updating prompts to new versions:

1. Copy existing prompt to new version file
2. Update `version` and `lastUpdated` fields
3. Make desired changes
4. Run linter and tests
5. Update agent registry to use new version
6. Keep old version for backward compatibility
