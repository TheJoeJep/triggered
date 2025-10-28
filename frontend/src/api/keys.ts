import { api } from './client'
import { ApiKey } from '../types'

export const keysApi = {
  list: async (): Promise<ApiKey[]> => {
    const { data } = await api.get('/api/keys')
    return data.apiKeys
  },

  create: async (name: string): Promise<ApiKey & { key: string; message: string }> => {
    const { data } = await api.post('/api/keys', { name })
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/keys/${id}`)
  },
}

