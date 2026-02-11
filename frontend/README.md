# GIRA Dashboard Frontend

React + TypeScript frontend for the GIRA Raw Data → Control Dashboard.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Recharts** - Data visualization
- **openapi-typescript** - Type generation from OpenAPI spec

## Development

### Prerequisites

- Node.js >= 18.0.0
- Backend running on http://localhost:3000

### Install Dependencies

From the **repository root**:

```bash
npm install
```

This installs dependencies for both frontend and backend using npm workspaces.

### Run Development Server

From the **repository root**:

```bash
npm run dev
```

This starts both frontend (port 5173) and backend (port 3000) concurrently.

Or run just the frontend:

```bash
npm run dev:frontend
```

### Access the Application

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **API Docs**: [http://localhost:3000/docs](http://localhost:3000/docs)

### Generate API Types

After the backend is running and the OpenAPI spec is up-to-date:

```bash
cd frontend
npm run generate-api-types
```

This generates TypeScript types from `../output/contracts/openapi.yaml` into `src/types/api.ts`.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Alert.tsx        # Alert messages
│   │   ├── BreakdownTable.tsx
│   │   ├── FileUploadCard.tsx
│   │   ├── FiltersBar.tsx
│   │   ├── KpiCards.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── QualityPanel.tsx
│   │   └── TimeSeriesChart.tsx
│   ├── lib/
│   │   └── api-client.ts    # Type-safe API client
│   ├── pages/               # Route pages
│   │   ├── DashboardPage.tsx
│   │   ├── DatasetListPage.tsx
│   │   └── UploadPage.tsx
│   ├── types/
│   │   └── api.ts           # Generated OpenAPI types
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tsconfig.json            # TypeScript config (strict mode)
├── vite.config.ts           # Vite config with proxy
└── tailwind.config.js
```

## API Integration

### Proxy Configuration

The Vite dev server proxies `/api` requests to `http://localhost:3000`:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

### API Client

All API calls use relative URLs through the proxy:

```typescript
// Example: Fetch users
import { api } from '@/lib/api-client'

const users = await api.users.list({ page: 1, pageSize: 20 })
```

The API client is typed based on the OpenAPI spec at `output/contracts/openapi.yaml`.

### Current Limitations

Some features use placeholder data because the corresponding API endpoints are not yet implemented:

- **Datasets endpoints** - Using `/users` as placeholder
- **Upload endpoint** - `POST /api/v1/datasets/upload` not implemented
- **Statistics endpoints** - Mock data for KPIs, charts, and quality metrics

When these endpoints are added to the OpenAPI spec and implemented in the backend:

1. Run `npm run generate-api-types` to update types
2. Update the API calls in pages/components to use the new endpoints

## Features

### Pages

1. **Dataset List** (`/`)
   - Lists all datasets (placeholder using users endpoint)
   - Links to dashboard for each dataset
   - Upload new dataset button

2. **Upload** (`/upload`)
   - Upload CSV/XLSX files (form ready, endpoint not implemented)
   - Set dataset name and description
   - File validation

3. **Dashboard** (`/dashboard/:id`)
   - KPI cards with trends
   - Time series visualization
   - Category breakdown table
   - Data quality panel
   - Filters bar

### Components

- **Alert** - Info, success, warning, error messages
- **LoadingSpinner** - Loading states
- **FileUploadCard** - Drag-and-drop file upload
- **KpiCards** - Metric cards with change indicators
- **TimeSeriesChart** - Line chart with Recharts
- **BreakdownTable** - Categorical data table
- **QualityPanel** - Data quality metrics
- **FiltersBar** - Date range and category filters

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server.

## Environment Variables

Create `.env.local` for production overrides:

```bash
# Optional - defaults to /api (proxy in dev)
VITE_API_BASE_URL=https://api.example.com
```

## TypeScript

Strict mode is enabled. All code must pass type checking:

```bash
npm run typecheck
```

## Known Issues / TODOs

- [ ] Implement real datasets endpoints in backend
- [ ] Add upload endpoint to OpenAPI spec
- [ ] Connect statistics/metrics endpoints
- [ ] Enable server-side filtering (query params in OpenAPI)
- [ ] Add authentication/authorization
- [ ] Add error boundary for runtime errors
- [ ] Add E2E tests

## Contributing

1. API changes must be reflected in `output/contracts/openapi.yaml`
2. Run `npm run generate-api-types` after OpenAPI updates
3. Update pages/components to use new types
4. All components must handle loading/error states
5. Use TypeScript strict mode (no `any` without justification)
