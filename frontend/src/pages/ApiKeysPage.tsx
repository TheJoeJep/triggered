import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keysApi } from '../api/keys'
import { ApiKey } from '../types'

export default function ApiKeysPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: keysApi.list,
  })

  const createMutation = useMutation({
    mutationFn: keysApi.create,
    onSuccess: (data) => {
      setGeneratedKey(data.key)
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
      setShowCreateModal(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: keysApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return
    createMutation.mutate(newKeyName)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          Create API Key
        </button>
      </div>

      {generatedKey && (
        <div className="card mb-6 bg-green-50 border-2 border-green-500">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Your API key has been generated!
              </h3>
              <p className="text-sm text-green-700 mb-3">
                Save this key securely. You won't be able to see it again.
              </p>
              <div className="flex gap-2">
                <code className="bg-white px-3 py-2 rounded text-sm font-mono border border-green-300">
                  {generatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="btn-secondary text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => setGeneratedKey(null)}
              className="text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Create API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My API Key"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewKeyName('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleCreateKey} className="btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="card">Loading...</div>
      ) : apiKeys?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No API keys yet</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Your First API Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys?.map((key: ApiKey) => (
            <div key={key.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                  {key.lastUsed && (
                    <p className="text-sm text-gray-500">
                      Last used: {new Date(key.lastUsed).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this API key?')) {
                      deleteMutation.mutate(key.id)
                    }
                  }}
                  className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

