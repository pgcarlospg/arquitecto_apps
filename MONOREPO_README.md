# Prompt & App Architect Studio - Monorepo

Complete development environment with backend generator + frontend dashboard.

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)

### One-Command Setup

```bash
# 1. Install all dependencies (root + backend + frontend)
npm install

# 2. Run both backend and frontend concurrently
npm run dev
```

That's it! You now have:
- **Backend API** running on [http://localhost:3000](http://localhost:3000)
- **Frontend Dashboard** running on [http://localhost:5173](http://localhost:5173)
- **API Docs** at [http://localhost:3000/docs](http://localhost:3000/docs)

## Project Structure

```
arquitecto_apps/
├── studio/                    # Backend generator (Architect Studio CLI)
│   ├── agents/                # 7 specialized agents
│   ├── schemas/               # JSON schemas
│   ├── orchestrator/          # Pipeline execution
│   └── cli.ts                 # CLI entry point
├── output/                    # Generated artifacts
│   ├── scaffold/              # Generated Fastify backend
│   │   ├── src/              # Backend source code
│   │   │   ├── index.ts      # Server entry
│   │   │   ├── app.ts        # Fastify app with CORS
│   │   │   └── config/       # Configuration
│   │   └── package.json
│   ├── contracts/
│   │   └── openapi.yaml      # API contract (single source of truth)
│   ├── design/               # Architecture docs
│   ├── prompts/              # Versioned prompt packs
│   └── eval/                 # Quality reports
├── frontend/                  # React + TypeScript dashboard
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── components/       # UI components
│   │   ├── lib/              # API client
│   │   └── types/            # TypeScript types
│   └── package.json
├── package.json              # Root workspace config
└── README.md                 # This file
```

## Available Commands

### Development

```bash
# Run both backend + frontend (RECOMMENDED)
npm run dev

# Run only frontend
npm run dev:frontend

# Run only backend
npm run dev:backend

# Run the generator CLI
npm run studio:run -- --spec spec/gira_dashboard.md
```

### Build

```bash
# Build everything
npm run build

# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend
```

### Type Checking

```bash
# Check TypeScript types
npm run typecheck
```

## How It Works

### 1. Generate Backend from Spec

```bash
npm run studio:run -- --spec spec/gira_dashboard.md
```

This runs the 7-agent pipeline:
1. **RequirementsStructurer** - Parse Markdown → Design Brief
2. **DomainModel** - Extract entities and relationships
3. **SystemArchitect** - Design components + ADRs
4. **APIContract** - Generate OpenAPI spec
5. **PromptPackDesigner** - Create prompt packs 
6. **ScaffoldBuilder** - Generate build plan
7. **ReviewerVerifier** - Run quality gates

**Output**: `output/` directory with all artifacts including `openapi.yaml`

### 2. Backend Server

The generated backend (`output/scaffold/`) is a **Fastify** server with:
- CORS enabled for frontend proxy
- Swagger UI at `/docs`
- Stub endpoints matching OpenAPI spec
- Health check at `/api/v1/health`

All endpoints return mock data - **replace with real DB queries**.

### 3. Frontend Dashboard

The React app (`frontend/`) includes:
- **Pages**: Dataset list, Upload, Dashboard
- **Components**: KPI cards, charts, tables, filters
- **API Client**: Type-safe wrapper around fetch
- **Vite Proxy**: `/api` → `http://localhost:3000`

Frontend calls use relative URLs (`/api/v1/users`) - no CORS issues!

### 4. API Contract = Single Source of Truth

**IMPORTANT**: `output/contracts/openapi.yaml` defines all endpoints

- Frontend types are generated from this file
- Backend implements these endpoints
- **Never invent endpoints** - update OpenAPI first

To regenerate frontend types:

```bash
cd frontend
npm run generate-api-types
```

## Monorepo Configuration

### npm Workspaces

Root `package.json` defines workspaces:

```json
{
  "workspaces": [
    "output/scaffold",
    "frontend"
  ]
}
```

Benefits:
- Single `npm install` at root installs everything
- Shared `node_modules` (hoisting)
- Consistent dependency versions

### Concurrently

We use `concurrently` to run both servers:

```json
{
  "scripts": {
    "dev": "concurrently --kill-others --names \"BACKEND,FRONTEND\" -c \"bgBlue,bgMagenta\" \"npm run dev:backend\" \"npm run dev:frontend\""
  }
}
```

- `--kill-others`: Stop all when one fails
- `--names`: Label each process
- `-c`: Colors for readability

## Proxy Configuration

**Frontend** (Vite):

```typescript
// frontend/vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

**Backend** (Fastify):

```typescript
// output/scaffold/src/app.ts
await fastify.register(cors, {
  origin: '*', // Allow all origins in dev
  credentials: true,
});
```

## URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React dashboard |
| Backend API | http://localhost:3000 | Fastify server |
| API Docs | http://localhost:3000/docs | Swagger UI |
| Health Check | http://localhost:3000/api/v1/health | Backend status |

## Current Limitations (MVP)

### Backend

The generated backend has **stub endpoints** that return mock data:

```typescript
// All CRUD operations return 501 Not Implemented
fastify.get('/api/v1/users', async () => {
  return { data: [], pagination: { ... } }
})
```

**To implement**:
1. Add database connection (PostgreSQL configured in .env.example)
2. Create models/repositories
3. Implement route handlers with real queries

### Frontend

Some pages use placeholders:

- **Dataset List** - Uses `/users` endpoint (datasets endpoint doesn't exist)
- **Upload Page** - Form ready but `POST /api/v1/datasets/upload` not implemented
- Mock data for charts and KPIs

**To implement**:
1. Add dataset endpoints to OpenAPI spec
2. Implement backend endpoints
3. Run `npm run generate-api-types` in frontend
4. Update page API calls

## Troubleshooting

### Backend won't start

- Check if port 3000 is already in use
- Verify `output/scaffold/src/` exists
- Run `npm install` in `output/scaffold/`

### Frontend can't connect to backend

- Ensure backend is running on port 3000
- Check proxy config in `frontend/vite.config.ts`
- Open DevTools Network tab - requests should go to `/api/v1/...`

### TypeScript errors in frontend

- Run `npm run typecheck` to see all errors
- If OpenAPI types are stale, run `npm run generate-api-types`
- Check `frontend/src/types/api.ts`

### Workspaces not working

- Delete `node_modules` at root and in subdirs
- Delete all `package-lock.json` files
- Run `npm install` at root again

## Next Steps

1. ✅ **You're running!** Both servers should be live.
2. **Open http://localhost:5173** - See the dashboard
3. **Check http://localhost:3000/docs** - Review API docs
4. **Implement real endpoints** - Replace stub data with DB queries
5. **Add datasets endpoints** - Update OpenAPI spec and backend
6. **Generate types** - Run `npm run generate-api-types` after API changes

## Architecture Decisions

### Why Vite Proxy vs CORS?

**Proxy** (current approach):
- ✅ No CORS issues in development
- ✅ Frontend uses relative URLs `/api`
- ✅ Same-origin policy satisfied
- ✅ Easier debugging (single origin)

**CORS** (alternative):
- ❌ Requires backend CORS config
- ❌ Preflight OPTIONS requests
- ❌ Credentials handling complexity

### Why npm Workspaces vs Turborepo?

**npm Workspaces** (current):
- ✅ Built into npm (no extra tools)
- ✅ Simple for 2-3 packages
- ✅ Sufficient for MVP

**Turborepo** (future):
- Better for 5+ packages
- Advanced caching
- Parallel builds

### Why Concurrently vs npm-run-all?

**Concurrently**:
- ✅ Better Windows support
- ✅ Colors and prefixes
- ✅ Kill-others flag

Both work fine - personal preference.

## Contributing

See individual READMEs:
- [Frontend README](frontend/README.md)
- [Backend README](output/scaffold/README.md) (generated)

## License

MIT
