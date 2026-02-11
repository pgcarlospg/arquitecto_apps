# 🏗️ Prompt & App Architect Studio

A deterministic CLI tool that transforms functional specifications into complete application architectures, API contracts, code scaffolds, and versioned prompt packs for specialized agents.

## Features

- 🎯 **Requirements Structuring**: Converts functional specs into structured design briefs
- 🧩 **Domain Modeling**: Extracts entities, relationships, and business logic
- 🏛️ **System Architecture**: Generates component maps with ADRs (Architecture Decision Records)
- 📋 **API Contracts**: Produces OpenAPI 3.0 specifications with JSON schemas
- 🤖 **Prompt Engineering**: Creates versioned prompt packs for each specialized agent
- 🚀 **Code Scaffolding**: Generates runnable Fastify backend with Docker setup
- ✅ **Quality Gates**: Validates artifacts with schema checks and cross-validation
- 📊 **Audit Trail**: Complete reproducibility with input hashes and versioning

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Quick Start

### Installation

```bash
cd arquitecto_apps
npm install
```

### Build

```bash
npm run build
```

### Run the Studio

```bash
# Using the dev script (no build required)
npm run studio:run -- --spec spec/functional.md

# Or after building
node dist/cli.js run --spec spec/functional.md
```

### Output Structure

The pipeline generates a complete `output/` directory:

```
output/
├── design/
│   ├── design_brief.json       # Structured requirements
│   └── architecture.md         # System architecture with ADRs
├── contracts/
│   ├── openapi.yaml           # OpenAPI 3.0 specification
│   └── schemas/               # JSON schemas for entities
├── prompts/
│   └── <agent>/
│       └── v1.0.0.md          # Versioned prompt packs
├── scaffold/
│   ├── src/                   # Runnable Fastify backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── docker-compose.yml
├── eval/
│   └── report.md              # Quality gate results
└── audit/
    ├── run.json               # Complete run metadata
    └── log.jsonl              # Structured logs
```

### Test the Generated Scaffold

```bash
cd output/scaffold
npm install
npm run dev                    # Start development server

# In another terminal
curl http://localhost:3000/health

# Or run with Docker
docker-compose up -d
```

## Agent Pipeline

The studio orchestrates 7 specialized agents:

1. **RequirementsStructurer** - Parses functional specs into structured design briefs
2. **DomainModel** - Extracts domain entities and relationships
3. **SystemArchitect** - Designs component architecture with ADRs
4. **APIContract** - Generates OpenAPI specs and schemas
5. **PromptPackDesigner** - Creates versioned prompts for all agents
6. **ScaffoldBuilder** - Generates runnable code from architecture
7. **ReviewerVerifier** - Validates coherence and quality

## CLI Commands

```bash
# Run the full pipeline
npm run studio:run -- --spec <path-to-spec.md> [--output <dir>] [--verbose]

# Lint prompt packs
npm run studio:lint -- [--prompts <dir>]

# Run tests (placeholder in MVP)
npm run studio:test
```

## Example Specs

See `spec/examples/` for sample functional specifications:

- `spec/functional.md` - Generic template
- `spec/examples/todo_app.md` - Complete Todo application example

## Quality Gates

Every artifact passes through validation:

- ✅ **Schema Validation**: All JSON outputs validated with AJV
- ✅ **Use Case Coverage**: OpenAPI paths cover all use cases
- ✅ **Entity Alignment**: Components reference valid domain entities
- ✅ **ADR Completeness**: At least 3 ADRs with alternatives and tradeoffs
- ✅ **Prompt Coverage**: Versioned prompts exist for all agents
- ✅ **Scaffold Integrity**: Generated code has valid dependencies and scripts

## Extending the Studio

### Add a New Agent

1. Create agent class in `studio/agents/`:
   ```typescript
   export class MyAgent extends BaseAgent<InputType, OutputType> {
     readonly config = {
       id: 'my-agent',
       name: 'My Agent',
       inputSchema: 'https://architect-studio/schemas/input.json',
       outputSchema: 'https://architect-studio/schemas/output.json',
     };
     
     protected async execute(input: InputType, ctx: AgentContext): Promise<OutputType> {
       // Implementation
     }
   }
   ```

2. Register in `studio/agents/registry.ts`:
   ```typescript
   export const AGENT_PIPELINE = [
     // ...existing stages
     { agentId: 'my-agent', dependsOn: ['some-other-agent'] },
   ];
   ```

### Add a New Schema

Add JSON schema to `studio/schemas/` with proper `$id` and the schema validator will auto-discover it.

### Add Custom Quality Gates

Export a gate check function in `studio/utils/cross_checks.ts`:

```typescript
export const myCustomCheck: GateCheckFn = (ctx) => {
  // Validation logic
  return [{ passed: true, severity: 'info', message: 'Check passed' }];
};
```

## Architecture Decisions

See `QUESTIONS.md` for documented assumptions and design decisions.

## Roadmap

- [ ] LLM integration (OpenAI, Anthropic, local models)
- [ ] Python/Java scaffold support
- [ ] MCP (Model Context Protocol) tool integration
- [ ] Vector search for requirement analysis
- [ ] Parallel agent execution
- [ ] Interactive mode with feedback loops
- [ ] Plugin system for custom agents

## License

MIT

## Contributing

This is an MVP. Contributions welcome! Please check `QUESTIONS.md` for current assumptions and limitations.
