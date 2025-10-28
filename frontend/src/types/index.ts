export interface User {
  id: string
  email: string
  createdAt: string
}

export interface ApiKey {
  id: string
  name: string
  lastUsed: string | null
  createdAt: string
  key?: string // Only present when creating
}

export interface Trigger {
  id: string
  name: string
  webhookUrl: string
  payload: any
  scheduleType: 'one-time' | 'recurring' | 'interval'
  triggerTime?: string | null
  interval?: number | null
  maxExecutions?: number | null
  executionCount: number
  delayMinutes?: number | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface TriggerExecution {
  id: string
  triggerId: string
  executedAt: string
  status: 'success' | 'failure' | 'retrying'
  responseCode?: number | null
  errorMessage?: string | null
  responseBody?: string | null
}

export interface CreateTriggerData {
  name: string
  webhookUrl: string
  payload: any
  scheduleType: 'one-time' | 'recurring' | 'interval'
  triggerTime?: string
  interval?: number
  maxExecutions?: number
  delayMinutes?: number
  enabled?: boolean
}

