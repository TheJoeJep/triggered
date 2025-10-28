import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

export const triggerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  webhookUrl: z.string().url('Invalid webhook URL'),
  payload: z.any(), // JSON payload
  scheduleType: z.enum(['one-time', 'recurring', 'interval']),
  triggerTime: z.string().datetime().optional(),
  interval: z.number().int().positive().optional(),
  maxExecutions: z.number().int().positive().optional(),
  delayMinutes: z.number().int().positive().optional(),
  enabled: z.boolean().optional(),
});

