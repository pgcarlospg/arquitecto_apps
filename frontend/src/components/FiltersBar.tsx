interface FiltersBarProps {
  filters: {
    dateRange: string
    category: string
  }
  onFiltersChange: (filters: { dateRange: string; category: string }) => void
}

export function FiltersBar({ filters, onFiltersChange }: FiltersBarProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Date Range Filter */}
        <div>
          <label
            htmlFor="dateRange"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date Range
          </label>
          <select
            id="dateRange"
            value={filters.dateRange}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateRange: e.target.value })
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) =>
              onFiltersChange({ ...filters, category: e.target.value })
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Categories</option>
            <option value="a">Category A</option>
            <option value="b">Category B</option>
            <option value="c">Category C</option>
          </select>
        </div>

        {/* Status Filter - Disabled (not in API yet) */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Status (Not supported by API yet)
          </label>
          <select
            id="status"
            disabled
            className="block w-full rounded-md border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed shadow-sm sm:text-sm"
          >
            <option>All Statuses</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Enable when API supports status filtering
          </p>
        </div>
      </div>

      {/* Filter Notice */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
        ℹ️ Filters are client-side only. Backend API filtering will be enabled when
        query parameters are added to the OpenAPI spec.
      </div>
    </div>
  )
}
