import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getUserId, AuthErrors } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { userSettingsSchema } from '@/lib/validations/settings'
import { ZodError } from 'zod'

export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    const userId = getUserId(session)

    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    })

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId,
          pomodoroDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartPomodoros: false,
        }
      })
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (request: NextRequest, session: any) => {
  try {
    const userId = getUserId(session)
    const body = await request.json()
    const validatedData = userSettingsSchema.parse(body)

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        ...validatedData,
      }
    })

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Settings update error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
