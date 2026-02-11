import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock time series data - replace with real data from API
const mockData = [
  { date: '2024-01-01', value: 120, target: 100 },
  { date: '2024-01-08', value: 132, target: 110 },
  { date: '2024-01-15', value: 125, target: 115 },
  { date: '2024-01-22', value: 145, target: 120 },
  { date: '2024-01-29', value: 138, target: 125 },
  { date: '2024-02-05', value: 155, target: 130 },
  { date: '2024-02-12', value: 162, target: 135 },
]

export function TimeSeriesChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mockData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Actual"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Target"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2 text-center">
        TODO: Replace with actual time series data from API
      </p>
    </div>
  )
}
