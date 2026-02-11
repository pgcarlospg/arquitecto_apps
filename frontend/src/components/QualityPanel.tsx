// Mock quality metrics - replace with real data from API
const mockQualityMetrics = [
  { name: 'Completeness', score: 94.5, status: 'good' },
  { name: 'Accuracy', score: 87.2, status: 'good' },
  { name: 'Consistency', score: 76.8, status: 'warning' },
  { name: 'Timeliness', score: 92.1, status: 'good' },
]

export function QualityPanel() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Data Quality</h2>
      <div className="space-y-4">
        {mockQualityMetrics.map((metric) => (
          <div key={metric.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                {metric.name}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {metric.score}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  metric.status === 'good'
                    ? 'bg-green-500'
                    : metric.status === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${metric.score}%` }}
              ></div>
            </div>
          </div>
        ))}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Overall Quality Score
            </span>
            <span className="text-2xl font-bold text-gray-900">87.7%</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Based on {mockQualityMetrics.length} quality dimensions
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          TODO: Replace with actual quality metrics from API
        </p>
      </div>
    </div>
  )
}
