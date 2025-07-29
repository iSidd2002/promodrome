import { z } from 'zod'

export const createSessionSchema = z.object({
  sessionType: z.enum(['POMODORO', 'SHORT_BREAK', 'LONG_BREAK']),
  plannedDuration: z
    .number()
    .min(60, 'Session must be at least 1 minute')
    .max(3600, 'Session must be less than 1 hour'),
  startTime: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export const updateSessionSchema = z.object({
  endTime: z.string().datetime().optional(),
  actualDuration: z
    .number()
    .min(0, 'Actual duration cannot be negative')
    .optional(),
  completed: z.boolean().optional(),
  pausedTime: z
    .number()
    .min(0, 'Paused time cannot be negative')
    .optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export const getSessionsSchema = z.object({
  limit: z
    .string()
    .transform(Number)
    .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .optional(),
  offset: z
    .string()
    .transform(Number)
    .refine(n => n >= 0, 'Offset must be non-negative')
    .optional(),
  type: z.enum(['POMODORO', 'SHORT_BREAK', 'LONG_BREAK']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
export type GetSessionsInput = z.infer<typeof getSessionsSchema>
