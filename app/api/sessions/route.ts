import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getUserId, AuthErrors } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { createSessionSchema, getSessionsSchema } from '@/lib/validations/session'
import { ZodError } from 'zod'

export const POST = withAuth(async (request: NextRequest, session: any) => {
  try {
    const userId = getUserId(session)
    const body = await request.json()
    const { sessionType, plannedDuration, startTime, tags, notes } = createSessionSchema.parse(body)

    const pomodoroSession = await prisma.pomodoroSession.create({
      data: {
        userId,
        sessionType,
        plannedDuration,
        startTime: new Date(startTime),
        tags: tags || [],
        notes,
      }
    })

    return NextResponse.json(pomodoroSession, { status: 201 })
  } catch (error) {
    console.error('Session creation error:', error)

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

export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    const userId = getUserId(session)

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const { 
      limit = 50, 
      offset = 0, 
      type, 
      startDate, 
      endDate 
    } = getSessionsSchema.parse(queryParams)

    const where: Record<string, unknown> = {
      userId,
    }

    if (type) {
      where.sessionType = type
    }

    if (startDate || endDate) {
      where.startTime = {} as Record<string, Date>
      if (startDate) (where.startTime as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.startTime as Record<string, Date>).lte = new Date(endDate)
    }

    const [sessions, total] = await Promise.all([
      prisma.pomodoroSession.findMany({
        where,
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.pomodoroSession.count({ where })
    ])

    return NextResponse.json({
      data: sessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Sessions fetch error:', error)

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
