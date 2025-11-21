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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(255,95,31,0.15)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-primary-500 to-accent bg-clip-text text-transparent">
            Create Trigger
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="My Awesome Trigger"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Webhook URL *
            </label>
            <input
              type="url"
              required
              className="input-field"
              placeholder="https://api.example.com/webhook"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule Type *
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['one-time', 'recurring', 'interval'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduleType: type as any })}
                  className={`px-4 py-3 rounded-lg border transition-all duration-300 capitalize ${formData.scheduleType === type
                    ? 'bg-primary-600/20 border-primary-500 text-primary-500 shadow-[0_0_15px_rgba(255,95,31,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {formData.scheduleType === 'one-time' && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
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
            </div>
          )}

          {formData.scheduleType === 'interval' && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
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

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
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

