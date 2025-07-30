import { z } from 'zod'

export const userSettingsSchema = z.object({
  pomodoroDuration: z
    .number()
    .positive('Pomodoro duration must be a positive number'),
  shortBreakDuration: z
    .number()
    .positive('Short break duration must be a positive number'),
  longBreakDuration: z
    .number()
    .positive('Long break duration must be a positive number'),
  longBreakInterval: z
    .number()
    .positive('Long break interval must be a positive number')
    .int('Long break interval must be a whole number'),
  autoStartBreaks: z.boolean().optional(),
  autoStartPomodoros: z.boolean().optional(),
})

export type UserSettingsInput = z.infer<typeof userSettingsSchema>
