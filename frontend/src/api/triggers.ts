import { api } from './client'
import { Trigger, CreateTriggerData, TriggerExecution } from '../types'

export const triggersApi = {
  list: async (page: number = 1, limit: number = 20) => {
    const { data } = await api.get('/api/triggers', { params: { page, limit } })
    return data
  },

  get: async (id: string): Promise<Trigger> => {
    const { data } = await api.get(`/api/triggers/${id}`)
    return data.trigger
  },

  create: async (triggerData: CreateTriggerData): Promise<Trigger> => {
    const { data } = await api.post('/api/triggers', triggerData)
    return data.trigger
  },

  update: async (id: string, triggerData: Partial<CreateTriggerData>): Promise<Trigger> => {
    const { data } = await api.put(`/api/triggers/${id}`, triggerData)
    return data.trigger
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/triggers/${id}`)
  },

  pause: async (id: string): Promise<Trigger> => {
    const { data } = await api.post(`/api/triggers/${id}/pause`)
    return data.trigger
  },

  resume: async (id: string): Promise<Trigger> => {
    const { data } = await api.post(`/api/triggers/${id}/resume`)
    return data.trigger
  },

  getExecutions: async (id: string, page: number = 1, limit: number = 50) => {
    const { data } = await api.get(`/api/triggers/${id}/executions`, { params: { page, limit } })
    return data
  },
}

