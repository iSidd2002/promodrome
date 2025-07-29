import { z } from 'zod'

export const userSettingsSchema = z.object({
  pomodoroDuration: z
    .number()
    .min(1, 'Pomodoro duration must be at least 1 minute')
    .max(60, 'Pomodoro duration must be less than 60 minutes'),
  shortBreakDuration: z
    .number()
    .min(1, 'Short break duration must be at least 1 minute')
    .max(30, 'Short break duration must be less than 30 minutes'),
  longBreakDuration: z
    .number()
    .min(1, 'Long break duration must be at least 1 minute')
    .max(60, 'Long break duration must be less than 60 minutes'),
  longBreakInterval: z
    .number()
    .min(2, 'Long break interval must be at least 2 pomodoros')
    .max(10, 'Long break interval must be less than 10 pomodoros'),
  autoStartBreaks: z.boolean().optional(),
  autoStartPomodoros: z.boolean().optional(),
})

export type UserSettingsInput = z.infer<typeof userSettingsSchema>
