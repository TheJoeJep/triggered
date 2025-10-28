import { api } from './client'
import { User } from '../types'

interface LoginResponse {
  user: User
  token: string
}

export const authApi = {
  register: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/api/auth/register', { email, password })
    return data
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/api/auth/login', { email, password })
    return data
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/api/auth/me')
    return data.user
  },
}

