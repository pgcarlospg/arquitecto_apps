// Mock KPI data - replace with real data from API when available
const mockKpis = [
  {
    name: 'Total Records',
    value: '1,234',
    change: '+12%',
    changeType: 'increase' as const,
  },
  {
    name: 'Data Quality Score',
    value: '94.5%',
    change: '+2.3%',
    changeType: 'increase' as const,
  },
  {
    name: 'Missing Values',
    value: '45',
    change: '-8',
    changeType: 'decrease' as const,
  },
  {
    name: 'Unique Categories',
    value: '23',
    change: '0',
    changeType: 'neutral' as const,
  },
]

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {mockKpis.map((kpi) => (
        <div
          key={kpi.name}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {kpi.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {kpi.value}
            </dd>
            {kpi.change !== '0' && (
              <dd className="mt-1 flex items-baseline text-sm">
                <span
                  className={`flex items-center font-medium ${
                    kpi.changeType === 'increase'
                      ? 'text-green-600'
                      : kpi.changeType === 'decrease'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {kpi.changeType === 'increase' && (
                    <svg
                      className="w-4 h-4 mr-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {kpi.changeType === 'decrease' && (
                    <svg
                      className="w-4 h-4 mr-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {kpi.change}
                </span>
                <span className="ml-2 text-gray-500">from last period</span>
              </dd>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
