import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { triggersApi } from '../api/triggers'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const { user } = useAuthStore()
  
  const { data: triggersData } = useQuery({
    queryKey: ['triggers', 1],
    queryFn: () => triggersApi.list(1, 5),
  })

  const triggers = triggersData?.triggers || []
  const totalTriggers = triggersData?.pagination?.total || 0

  const activeTriggers = triggers.filter((t: any) => t.enabled).length
  const totalExecutions = triggers.reduce((sum: number, t: any) => sum + t.executionCount, 0)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="mb-8">
        <p className="text-gray-600">
          Welcome back, <span className="font-semibold">{user?.email}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Triggers</h3>
          <p className="text-3xl font-bold text-primary-600">{totalTriggers}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Triggers</h3>
          <p className="text-3xl font-bold text-green-600">{activeTriggers}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Executions</h3>
          <p className="text-3xl font-bold text-blue-600">{totalExecutions}</p>
        </div>
      </div>

      {/* Recent Triggers */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Triggers</h2>
          <Link to="/triggers" className="btn-secondary text-sm">
            View All
          </Link>
        </div>

        {triggers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No triggers yet</p>
            <Link to="/triggers" className="btn-primary">
              Create Your First Trigger
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {triggers.map((trigger: any) => (
                  <tr key={trigger.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/triggers/${trigger.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-800"
                      >
                        {trigger.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trigger.scheduleType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          trigger.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {trigger.enabled ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trigger.executionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(trigger.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

