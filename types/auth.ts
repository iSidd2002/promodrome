import { User } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string | null
}

export interface UserWithSettings extends User {
  settings?: {
    pomodoroDuration: number
    shortBreakDuration: number
    longBreakDuration: number
    longBreakInterval: number
    autoStartBreaks: boolean
    autoStartPomodoros: boolean
  } | null
}

export interface SessionData {
  user: AuthUser
  expires: string
}
