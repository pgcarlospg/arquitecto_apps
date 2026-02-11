import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api-client'
import { Alert } from '../components/Alert'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function DatasetListPage() {
  // TODO: Replace with actual datasets endpoint when available in OpenAPI
  // Currently using 'users' as a placeholder for demonstration
  const { data, isLoading, error } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.users.list({ page: 1, pageSize: 20 }),
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load datasets: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view your GIRA control dashboard datasets
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Upload New Dataset
        </Link>
      </div>

      {/* TODO: This placeholder shows the API structure. Replace with actual datasets endpoint */}
      <Alert variant="info">
        ℹ️ <strong>Datasets endpoint not yet available in OpenAPI spec.</strong>
        <br />
        This page is using the <code>/api/v1/users</code> endpoint as a demo.
        <br />
        Once the backend implements <code>/api/v1/datasets</code>, update the API call here.
      </Alert>

      {data && data.data.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No datasets</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading a new dataset.</p>
          <div className="mt-6">
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload Dataset
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {data?.data.map((item: any, index: number) => (
              <li key={item.id || index}>
                <Link
                  to={`/dashboard/${item.id || index}`}
                  className="block hover:bg-gray-50 transition"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        Dataset {index + 1} (Placeholder)
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          TODO: Show dataset metadata when API is implemented
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && data.pagination && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{data.pagination.page}</span> of{' '}
                <span className="font-medium">{data.pagination.totalPages || 1}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
