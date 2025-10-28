import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { triggersApi } from '../api/triggers'
import { Trigger } from '../types'
import TriggerCreateModal from '../components/TriggerCreateModal'

export default function TriggersPage() {
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['triggers', page],
    queryFn: () => triggersApi.list(page, 20),
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => triggersApi.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => triggersApi.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => triggersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
    },
  })

  const triggers = data?.triggers || []
  const pagination = data?.pagination

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Triggers</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          Create Trigger
        </button>
      </div>

      {showCreate && (
        <TriggerCreateModal onClose={() => setShowCreate(false)} />
      )}

      {isLoading ? (
        <div className="card">Loading...</div>
      ) : triggers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No triggers yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Create Your First Trigger
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {triggers.map((trigger: Trigger) => (
            <div key={trigger.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/triggers/${trigger.id}`}
                      className="text-xl font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {trigger.name}
                    </Link>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        trigger.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {trigger.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Webhook:</span> {trigger.webhookUrl}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>
                      <span className="font-medium">Type:</span> {trigger.scheduleType}
                    </span>
                    <span>
                      <span className="font-medium">Executions:</span> {trigger.executionCount}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {trigger.enabled ? (
                    <button
                      onClick={() => pauseMutation.mutate(trigger.id)}
                      className="btn-secondary text-sm"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => resumeMutation.mutate(trigger.id)}
                      className="btn-primary text-sm"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this trigger?')) {
                        deleteMutation.mutate(trigger.id)
                      }
                    }}
                    className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

