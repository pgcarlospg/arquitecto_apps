# Assumptions & Open Questions

This document tracks assumptions made during MVP development and questions that need resolution for production use.

## Assumptions Made

### 1. LLM Provider
**Assumption**: Using deterministic stub agents for MVP; no external LLM calls.

**Why**: Ensures reproducibility, no API costs, passes schema validation consistently.

**Future**: Add LLM provider abstraction (OpenAI, Anthropic, local models) with same agent interface.

### 2. Default Architecture Style
**Assumption**: Modular monolith with layered architecture (presentation → application → domain → infrastructure).

**Why**: Simplest starting point; most projects start here before scaling to microservices.

**Alternative**: Could generate microservices architecture if spec explicitly requires it.

### 3. Database Choice
**Assumption**: PostgreSQL as default database.

**Why**: Most popular open-source RDBMS, good TypeScript support, Docker-friendly.

**Alternative**: Add MongoDB, MySQL support via config flags.

### 4. Backend Framework
**Assumption**: Fastify for Node.js backend.

**Why**: Fast, TypeScript-first, excellent OpenAPI integration, modern async/await.

**Alternative**: Express (more ecosystem), NestJS (enterprise), or Python/FastAPI stack.

### 5. Auth Implementation
**Assumption**: Placeholder middleware only; no real authentication.

**Why**: Auth requirements vary wildly by project; MVP focuses on structure.

**Future**: Generate JWT/OAuth2/session-based auth based on security requirements in spec.

### 6. Frontend Generation
**Assumption**: Minimal/placeholder frontend in MVP.

**Why**: Focus on backend architecture quality; frontend can be separate pipeline.

**Future**: Add React/Vue/Svelte scaffold with form generation from OpenAPI.

### 7. Test Generation
**Assumption**: No test file generation in MVP.

**Why**: Test strategy varies by team; would add complexity.

**Future**: Generate Vitest/Jest tests for routes, services, repositories.

### 8. Schema Versioning
**Assumption**: Single version (v1.0.0) for all schemas in MVP.

**Why**: No breaking changes yet; versioning infra in place for future.

**Future**: Implement schema migration when formats evolve.

### 9. Prompt Format
**Assumption**: YAML-based prompt files with Handlebars syntax.

**Why**: Human-readable, supports variables, easy to version control.

**Alternative**: JSON, TOML, or custom DSL.

### 10. Audit Storage
**Assumption**: JSONL file for audit logs.

**Why**: Simple, append-only, grepable, no external dependencies.

**Future**: PostgreSQL, MongoDB, or S3 for production audit trails.

### 11. Error Handling
**Assumption**: Pipeline stops on first error; partial outputs not saved.

**Why**: Ensures consistency; no half-generated artifacts.

**Alternative**: Continue-on-warning mode for iterative development.

### 12. Determinism
**Assumption**: Stub agents must produce identical output for identical input.

**Why**: Testing, reproducibility, audit trail integrity.

**Implementation**: Seed RNGs from input hash, avoid timestamps in generated code.

### 13. Input Spec Format
**Assumption**: Markdown with specific sections (Goals, Use Cases, Constraints).

**Why**: Developer-friendly, version-controllable, supports tables/lists.

**Alternative**: Structured YAML/JSON input for programmatic generation.

### 14. OpenAPI Version
**Assumption**: OpenAPI 3.0.3

**Why**: Widely supported, stable spec, good tooling ecosystem.

**Future**: Upgrade to 3.1.x when AsyncAPI integration needed.

### 15. Docker Compose
**Assumption**: Development docker-compose only; not production-ready.

**Why**: Local dev environment setup; production needs K8s/ECS/etc.

**Future**: Add Kubernetes manifests, Terraform, or CDK outputs.

## Open Questions for Production

### Q1: LLM Model Selection
How should users configure which LLM to use per agent? Environment variables? Config file?

**Proposal**: `.studio.config.json` with per-agent model settings.

### Q2: Prompt Versioning Strategy
When prompts change, how do we handle backward compatibility with existing runs?

**Proposal**: Semantic versioning with major bumps for breaking schema changes.

### Q3: Multi-Language Support
Should we support generating Python/Java/Go backends from same spec?

**Proposal**: Add `--stack` flag: `--stack python-fastapi`, `--stack java-spring`

### Q4: Interactive Mode
Should the CLI support interactive prompts to fill missing spec details?

**Proposal**: Add `--interactive` flag that asks questions for missing required fields.

### Q5: Incremental Updates
If spec changes, can we regenerate only affected artifacts?

**Proposal**: Hash-based change detection; only re-run dependent agents.

### Q6: Schema Registry
Should JSON schemas be served from HTTP endpoint for $ref resolution?

**Proposal**: Publish schemas to GitHub Pages or NPM package.

### Q7: Agent Marketplace
Should third-party agents be pluggable?

**Proposal**: NPM package convention: `@architect-studio/agent-*`

### Q8: Validation Strictness
Should quality gates be configurable (strict/standard/relaxed)?

**Proposal**: Add `--gates` flag with preset configs.

### Q9: Output Formats
Should we support JSON output for programmatic consumption?

**Proposal**: Add `--format json|yaml|markdown` for reports.

### Q10: Telemetry
Should we collect anonymous usage stats to improve prompts?

**Proposal**: Opt-in telemetry with `--telemetry` flag.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-11 | Use Commander over Yargs | Simpler API, better tree-shaking |
| 2026-02-11 | Use Handlebars over EJS | Cleaner syntax for scaffolds |
| 2026-02-11 | Deterministic stubs first | Ensures reproducibility before LLM integration |
| 2026-02-11 | JSONL for audit logs | Simple, append-only, sufficient for MVP |
| 2026-02-11 | Sequential pipeline | Simpler debugging, agents have dependencies |
| 2026-02-11 | No parallel execution | MVP optimization; add later with worker threads |
| 2026-02-11 | Fastify over Express | TypeScript-first, faster, modern patterns |
| 2026-02-11 | PostgreSQL default | Most common choice, best Docker support |

## How to Update This Document

When implementing new features:
1. Mark assumptions as **Resolved** with implementation details
2. Add new assumptions with clear rationale
3. Move open questions to decisions log when answered
4. Keep this doc in sync with actual code behavior
