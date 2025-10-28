import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { triggersApi } from '../api/triggers'

export default function TriggerDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['trigger', id],
    queryFn: () => triggersApi.get(id!),
  })

  const { data: executionsData } = useQuery({
    queryKey: ['executions', id, 1],
    queryFn: () => triggersApi.getExecutions(id!, 1, 20),
  })

  if (isLoading) {
    return <div className="card">Loading...</div>
  }

  if (!data) {
    return <div className="card">Trigger not found</div>
  }

  const trigger = data

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{trigger.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Webhook URL</dt>
              <dd className="mt-1 text-sm text-gray-900">{trigger.webhookUrl}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Schedule Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{trigger.scheduleType}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    trigger.enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {trigger.enabled ? 'Active' : 'Paused'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Execution Count</dt>
              <dd className="mt-1 text-sm text-gray-900">{trigger.executionCount}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Payload</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(trigger.payload, null, 2)}
          </pre>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Execution History</h2>
        {executionsData?.executions.length === 0 ? (
          <p className="text-gray-500">No executions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Executed At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Response
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executionsData?.executions.map((execution: any) => (
                  <tr key={execution.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(execution.executedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          execution.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {execution.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {execution.responseCode || execution.errorMessage || '-'}
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

