import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { triggersApi } from '../api/triggers'
import { CreateTriggerData } from '../types'

interface Props {
  onClose: () => void
}

export default function TriggerCreateModal({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<CreateTriggerData>({
    name: '',
    webhookUrl: '',
    payload: {},
    scheduleType: 'one-time',
    enabled: true,
  })
  const [payloadText, setPayloadText] = useState('{}')

  const createMutation = useMutation({
    mutationFn: triggersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = JSON.parse(payloadText)
      createMutation.mutate({ ...formData, payload })
    } catch (error) {
      alert('Invalid JSON payload')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Trigger</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL *
            </label>
            <input
              type="url"
              required
              className="input-field"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Type *
            </label>
            <select
              className="input-field"
              value={formData.scheduleType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scheduleType: e.target.value as any,
                })
              }
            >
              <option value="one-time">One-time</option>
              <option value="recurring">Recurring</option>
              <option value="interval">Interval</option>
            </select>
          </div>

          {formData.scheduleType === 'one-time' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Time *
              </label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={formData.triggerTime}
                onChange={(e) => setFormData({ ...formData, triggerTime: e.target.value })}
              />
            </div>
          )}

          {formData.scheduleType === 'recurring' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field"
                  value={formData.interval || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, interval: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Executions (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={formData.maxExecutions || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxExecutions: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </>
          )}

          {formData.scheduleType === 'interval' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay (minutes) *
              </label>
              <input
                type="number"
                required
                min="1"
                className="input-field"
                value={formData.delayMinutes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, delayMinutes: parseInt(e.target.value) })
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JSON Payload *
            </label>
            <textarea
              required
              rows={6}
              className="input-field font-mono text-sm"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Trigger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

