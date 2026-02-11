import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api-client'
import { KpiCards } from '../components/KpiCards'
import { TimeSeriesChart } from '../components/TimeSeriesChart'
import { BreakdownTable } from '../components/BreakdownTable'
import { QualityPanel } from '../components/QualityPanel'
import { FiltersBar } from '../components/FiltersBar'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { useState } from 'react'

export function DashboardPage() {
  const { id } = useParams<{ id: string }>()
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    category: 'all',
  })

  // TODO: Replace with actual dataset endpoint when available
  // Using users endpoint as placeholder
  const { data, isLoading, error } = useQuery({
    queryKey: ['dataset', id],
    queryFn: () => api.users.get(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load dataset: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dataset Dashboard: {id}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View KPIs, trends, and data quality metrics
        </p>
      </div>

      {/* Placeholder Notice */}
      <Alert variant="info">
        ℹ️ <strong>This is a placeholder dashboard.</strong>
        <br />
        Real data will be shown when <code>/api/v1/datasets/:id</code> is implemented.
        <br />
        Currently displaying mock data to demonstrate the UI structure.
      </Alert>

      {/* Filters */}
      <FiltersBar filters={filters} onFiltersChange={setFilters} />

      {/* KPI Cards */}
      <KpiCards />

      {/* Time Series Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Trend Analysis</h2>
        <TimeSeriesChart />
      </div>

      {/* Breakdown Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h2>
        <BreakdownTable />
      </div>

      {/* Data Quality Panel */}
      <QualityPanel />
    </div>
  )
}
